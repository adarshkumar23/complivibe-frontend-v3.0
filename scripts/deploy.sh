#!/usr/bin/env bash
# Deploy runbook for the current (non-Vercel) hosting reality: a long-running
# `next start` process on this box, previously started by hand with `nohup`.
# That manual pattern is exactly how a stale build can end up silently
# serving forever after a merge: someone updates the code but never restarts
# the process, and nothing detects it because the old build still returns
# 200s for every route.
#
# This script is the single supported way to ship a new build. It refuses to
# leave a stale process running: it builds first, and only restarts the
# service if the build succeeds AND the restarted process reports the exact
# commit that was just built (via GET /api/version, see
# app/api/version/route.ts). If either check fails, it exits non-zero
# instead of leaving things in an unknown state.
#
# Usage: scripts/deploy.sh [port] [systemd-unit-name]
#   scripts/deploy.sh                          # port 3000, no systemd unit (manual restart)
#   scripts/deploy.sh 3000 complivibe-frontend  # restart via `systemctl restart <unit>`
set -euo pipefail

PORT="${1:-3000}"
SYSTEMD_UNIT="${2:-}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "==> Deploying $(git rev-parse --abbrev-ref HEAD) @ $(git rev-parse HEAD) on port $PORT"

GIT_SHA="$(git rev-parse HEAD)"
BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
export NEXT_PUBLIC_GIT_SHA="$GIT_SHA"
export NEXT_PUBLIC_BUILD_TIME="$BUILD_TIME"

echo "==> Installing dependencies"
npm ci

echo "==> Building (tsc + next build must both pass; this mirrors CI's ci-gate)"
npx tsc --noEmit
npm run build

echo "==> Build succeeded. Restarting the running process."
if [ -n "$SYSTEMD_UNIT" ]; then
  # complivibe-frontend.service loads this file via EnvironmentFile= so the
  # restarted process picks up the SHA/build-time for this exact deploy
  # (systemctl restart itself has no way to pass ad-hoc env vars through).
  mkdir -p "$REPO_ROOT/deploy"
  {
    echo "NEXT_PUBLIC_GIT_SHA=$GIT_SHA"
    echo "NEXT_PUBLIC_BUILD_TIME=$BUILD_TIME"
  } > "$REPO_ROOT/deploy/current-version.env"
  sudo systemctl restart "$SYSTEMD_UNIT"
else
  # Manual mode: find whatever is bound to $PORT and replace it. This is the
  # fallback for hosts that don't have the systemd unit installed yet (see
  # deploy/complivibe-frontend.service) -- prefer the systemd path in real
  # production so a crash gets auto-restarted too, not just a deploy.
  # `ss` (iproute2) reliably reports the listening PID; `lsof` requires
  # elevated privileges to see another process's sockets on some hosts and
  # can silently return nothing, which previously made this fallback a no-op
  # -- it killed nothing, the old build kept running, and the deploy
  # "succeeded" while still serving stale code.
  OLD_PID="$(ss -tlnp 2>/dev/null | grep ":$PORT " | grep -o 'pid=[0-9]*' | head -1 | cut -d= -f2 || true)"
  if [ -n "$OLD_PID" ]; then
    echo "==> Stopping old process (pid $OLD_PID) on port $PORT"
    kill "$OLD_PID"
    for _ in $(seq 1 20); do
      kill -0 "$OLD_PID" 2>/dev/null || break
      sleep 0.5
    done
  fi
  echo "==> Starting new process on port $PORT"
  nohup env NEXT_PUBLIC_GIT_SHA="$GIT_SHA" NEXT_PUBLIC_BUILD_TIME="$BUILD_TIME" \
    npm start -- -p "$PORT" > "$REPO_ROOT/deploy.log" 2>&1 &
  disown
fi

echo "==> Waiting for the new process to come up and confirming it reports the deployed commit"
for _ in $(seq 1 30); do
  RESPONSE="$(curl -s "http://127.0.0.1:$PORT/api/version" || true)"
  REPORTED_SHA="$(echo "$RESPONSE" | grep -o '"gitSha":"[^"]*"' | cut -d'"' -f4 || true)"
  if [ "$REPORTED_SHA" = "$GIT_SHA" ]; then
    echo "==> Verified: running process now reports gitSha=$REPORTED_SHA (matches this deploy)."
    echo "==> Deploy complete."
    exit 0
  fi
  sleep 1
done

echo "::error::Deploy verification failed. The process on port $PORT never reported gitSha=$GIT_SHA (last response: ${RESPONSE:-<no response>}). It may still be serving a stale build, or failed to start -- check $REPO_ROOT/deploy.log."
exit 1
