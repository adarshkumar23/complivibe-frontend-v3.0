#!/usr/bin/env bash
# Frontend deploy — release-directory + `current` symlink model.
#
# WHY THIS EXISTS
# ---------------
# `next start` serves `.next/` from its working directory and holds BUILD_ID in
# memory. The old deploy ran `next build` *inside the live working directory*,
# rewriting `.next/` in place under the running server -- mid-build the dir is
# inconsistent (old chunks deleted, manifests half-written) so live requests
# throw ENOENT / "Cannot find module './NNNN.js'", and afterwards the on-disk
# BUILD_ID no longer matches the one in memory. That took prod down once.
#
# This script makes a build physically incapable of touching what is being
# served: every build happens in a FRESH release directory (a git worktree at
# the target commit, with its own .next + node_modules). Only if the build AND
# typecheck succeed does it atomically repoint the `current` symlink at the new
# release and restart the service. A failed build never reaches the swap, so
# prod is left exactly as it was. The previous release stays on disk for an
# instant rollback (see scripts/rollback.sh).
#
# It keeps the old safeguard: after restart it polls GET /api/version and fails
# the deploy unless the running process reports the exact commit just built.
#
# LAYOUT (deploy root, deliberately NOT the git repo):
#   /home/ubuntu/complivibe-frontend/
#     releases/<sha>/            git worktree, built here
#     current -> releases/<sha>  atomically swapped symlink the service runs from
#     shared/frontend.env        prod env, lives outside the repo (see below)
#
# ENV HAZARD FIX
# --------------
# NEXT_PUBLIC_* is inlined at BUILD time. Prod config therefore must be present
# when we build, but must NOT sit in the source tree where `next dev`/`next
# build` would auto-load `.env.local` and silently point a dev at the prod
# backend (that once created stray orgs in the prod DB). So prod env lives only
# in $DEPLOY_ROOT/shared/frontend.env -- sourced here at build time, and loaded
# by systemd at runtime -- never inside the git repo.
#
# Usage: scripts/deploy.sh [ref] [port] [systemd-unit]
#   scripts/deploy.sh                                   # HEAD, port 3000, unit complivibe-frontend
#   scripts/deploy.sh 928a12b 3000 complivibe-frontend  # explicit commit
#   scripts/deploy.sh HEAD 3001 ''                      # no systemd: manual `next start` on 3001 (for validation)
set -euo pipefail

REF="${1:-HEAD}"
PORT="${2:-3000}"
SYSTEMD_UNIT="${3-complivibe-frontend}"

SOURCE_REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_ROOT="${DEPLOY_ROOT:-/home/ubuntu/complivibe-frontend}"
RELEASES_DIR="$DEPLOY_ROOT/releases"
CURRENT_LINK="$DEPLOY_ROOT/current"
SHARED_ENV="$DEPLOY_ROOT/shared/frontend.env"
KEEP_RELEASES="${KEEP_RELEASES:-3}"

log() { echo "==> $*"; }
err() { echo "::error::$*" >&2; }

[ -d "$RELEASES_DIR" ] || { err "Deploy root $DEPLOY_ROOT not initialised (no releases/). See docs/deploy.md."; exit 1; }
[ -f "$SHARED_ENV" ]   || { err "Missing shared prod env $SHARED_ENV. See docs/deploy.md."; exit 1; }

cd "$SOURCE_REPO"
GIT_SHA="$(git rev-parse "$REF")"
SHORT_SHA="$(git rev-parse --short "$REF")"
BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
RELEASE_DIR="$RELEASES_DIR/$SHORT_SHA-$(date -u +%Y%m%d%H%M%S)"

log "Deploying ref $REF ($GIT_SHA) to $RELEASE_DIR (port $PORT, unit '${SYSTEMD_UNIT:-none}')"

# --- Build in an isolated release worktree. Nothing here touches `current`. ---
SWAPPED=0
cleanup_failed_build() {
  # Only runs if we bailed before the atomic swap: tear down the half-built
  # release so a failure leaves NO partial release behind and, crucially,
  # leaves `current`/prod exactly as it was.
  if [ "$SWAPPED" -eq 0 ] && [ -d "$RELEASE_DIR" ]; then
    err "Build failed before swap -- prod is untouched. Removing partial release $RELEASE_DIR."
    git -C "$SOURCE_REPO" worktree remove --force "$RELEASE_DIR" 2>/dev/null || rm -rf "$RELEASE_DIR"
  fi
}
trap cleanup_failed_build EXIT

log "Creating release worktree at $GIT_SHA"
git worktree add --detach "$RELEASE_DIR" "$GIT_SHA"

cd "$RELEASE_DIR"
# Prod env for the build (NEXT_PUBLIC_* is inlined now), from OUTSIDE the repo.
set -a; . "$SHARED_ENV"; set +a
export NEXT_PUBLIC_GIT_SHA="$GIT_SHA"
export NEXT_PUBLIC_BUILD_TIME="$BUILD_TIME"

log "Installing dependencies (npm ci)"
npm ci

log "Typecheck + build (tsc --noEmit && next build) -- same two gates as CI"
npx tsc --noEmit
npm run build

# Record what this release is, for humans and for the runtime EnvironmentFile.
mkdir -p "$RELEASE_DIR/deploy"
{
  echo "NEXT_PUBLIC_GIT_SHA=$GIT_SHA"
  echo "NEXT_PUBLIC_BUILD_TIME=$BUILD_TIME"
} > "$RELEASE_DIR/deploy/current-version.env"

log "Build succeeded. Atomically swapping 'current' -> $RELEASE_DIR"
PREV_TARGET=""
[ -L "$CURRENT_LINK" ] && PREV_TARGET="$(readlink -f "$CURRENT_LINK")"
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK.tmp"
mv -Tf "$CURRENT_LINK.tmp" "$CURRENT_LINK"   # rename(2): atomic replace of the symlink
SWAPPED=1
trap - EXIT
[ -n "$PREV_TARGET" ] && echo "$PREV_TARGET" > "$DEPLOY_ROOT/previous-release" || true

# --- Restart the running process against the new release. ---
if [ -n "$SYSTEMD_UNIT" ]; then
  log "Restarting systemd unit $SYSTEMD_UNIT"
  sudo systemctl restart "$SYSTEMD_UNIT"
else
  log "No systemd unit given: starting a standalone 'next start' on port $PORT from the new release"
  OLD_PID="$(ss -tlnp 2>/dev/null | grep ":$PORT " | grep -o 'pid=[0-9]*' | head -1 | cut -d= -f2 || true)"
  if [ -n "$OLD_PID" ]; then
    log "Stopping old process (pid $OLD_PID) on port $PORT"
    kill "$OLD_PID" || true
    for _ in $(seq 1 20); do kill -0 "$OLD_PID" 2>/dev/null || break; sleep 0.5; done
  fi
  ( cd "$CURRENT_LINK" && set -a && . "$SHARED_ENV" && . "$RELEASE_DIR/deploy/current-version.env" && set +a \
      && nohup npx next start -p "$PORT" -H 127.0.0.1 > "$DEPLOY_ROOT/deploy.log" 2>&1 & disown )
fi

# --- Verify the RUNNING process reports the commit we just built. ---
log "Waiting for the new process to report gitSha=$GIT_SHA on port $PORT"
for _ in $(seq 1 30); do
  RESPONSE="$(curl -s "http://127.0.0.1:$PORT/api/version" || true)"
  REPORTED_SHA="$(echo "$RESPONSE" | grep -o '"gitSha":"[^"]*"' | cut -d'"' -f4 || true)"
  if [ "$REPORTED_SHA" = "$GIT_SHA" ]; then
    log "Verified: running process reports gitSha=$REPORTED_SHA."
    # Prune old releases (keep the newest $KEEP_RELEASES), never the live one.
    LIVE="$(readlink -f "$CURRENT_LINK")"
    mapfile -t OLD < <(ls -1dt "$RELEASES_DIR"/*/ 2>/dev/null | sed 's:/*$::' | tail -n +$((KEEP_RELEASES + 1)))
    for d in "${OLD[@]:-}"; do
      [ -z "$d" ] && continue
      [ "$(readlink -f "$d")" = "$LIVE" ] && continue
      log "Pruning old release $d"
      git -C "$SOURCE_REPO" worktree remove --force "$d" 2>/dev/null || rm -rf "$d"
    done
    log "Deploy complete. Live: $RELEASE_DIR ($GIT_SHA)"
    exit 0
  fi
  sleep 1
done

err "Deploy verification FAILED: process on port $PORT never reported gitSha=$GIT_SHA (last: ${RESPONSE:-<none>}). The 'current' symlink was swapped but the service is unhealthy -- roll back with: scripts/rollback.sh ${SYSTEMD_UNIT:-}"
exit 1
