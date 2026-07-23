#!/usr/bin/env bash
# Rollback: repoint `current` at a PRIOR release and restart.
#
# Because every deploy leaves the prior release on disk (releases/<sha>/) and
# records its path in $DEPLOY_ROOT/previous-release, a rollback is just an
# atomic symlink swap back + a restart -- no rebuild, seconds not minutes.
#
# SAFETY: rollback must never roll FORWARD into newer/unreleased code. It is
# most likely to be run during an incident, by a stressed operator who will not
# read caveats. So this script:
#   * refuses if the target commit is a DESCENDANT of what is currently live
#     (i.e. rolling forward) -- a hard fail, independent of any confirmation;
#   * refuses a no-op (target == current);
#   * prints FROM and TO SHAs and requires an explicit confirmation before it
#     touches anything (set ROLLBACK_ASSUME_YES=1 to skip the prompt in
#     automation).
#
# Usage: scripts/rollback.sh [systemd-unit] [release-dir]
#   scripts/rollback.sh                       # roll back to $DEPLOY_ROOT/previous-release, unit complivibe-frontend
#   scripts/rollback.sh complivibe-frontend   # explicit unit
#   scripts/rollback.sh complivibe-frontend /home/ubuntu/complivibe-frontend/releases/<sha>-<ts>  # to a specific release
#
# List available releases: ls -1dt /home/ubuntu/complivibe-frontend/releases/*/
set -euo pipefail

SYSTEMD_UNIT="${1-complivibe-frontend}"
DEPLOY_ROOT="${DEPLOY_ROOT:-/home/ubuntu/complivibe-frontend}"
SOURCE_REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CURRENT_LINK="$DEPLOY_ROOT/current"
TARGET="${2:-}"

log() { echo "==> $*"; }
err() { echo "::error::$*" >&2; }

release_sha() {
  # SHA a release dir was built at, from its baked version env.
  grep -o 'NEXT_PUBLIC_GIT_SHA=.*' "$1/deploy/current-version.env" 2>/dev/null | cut -d= -f2 || true
}

# --- Resolve the target release ------------------------------------------------
if [ -z "$TARGET" ]; then
  [ -f "$DEPLOY_ROOT/previous-release" ] || { err "No $DEPLOY_ROOT/previous-release recorded, and no release dir given. Nothing to roll back to. Pick one explicitly: ls -1dt $DEPLOY_ROOT/releases/*/"; exit 1; }
  TARGET="$(cat "$DEPLOY_ROOT/previous-release")"
  [ -n "$TARGET" ] || { err "$DEPLOY_ROOT/previous-release is empty -- no valid rollback target recorded. Pick one explicitly: ls -1dt $DEPLOY_ROOT/releases/*/"; exit 1; }
fi
TARGET="$(readlink -f "$TARGET")"
[ -d "$TARGET" ] && [ -d "$TARGET/.next" ] || { err "Rollback target '$TARGET' is not a built release (no .next)."; exit 1; }

CURRENT_NOW="$(readlink -f "$CURRENT_LINK" 2>/dev/null || echo none)"
CUR_SHA="$(release_sha "$CURRENT_NOW")"
TGT_SHA="$(release_sha "$TARGET")"
[ -n "$TGT_SHA" ] || { err "Cannot determine target release's commit SHA ($TARGET/deploy/current-version.env missing). Refusing to roll back blindly."; exit 1; }

# --- Directional safety: never roll FORWARD -----------------------------------
if [ "$CUR_SHA" = "$TGT_SHA" ]; then
  err "Target ($TGT_SHA) is already what's live -- nothing to roll back to. Refusing no-op."
  exit 2
fi
if git -C "$SOURCE_REPO" cat-file -e "${CUR_SHA}^{commit}" 2>/dev/null && git -C "$SOURCE_REPO" cat-file -e "${TGT_SHA}^{commit}" 2>/dev/null; then
  if git -C "$SOURCE_REPO" merge-base --is-ancestor "$CUR_SHA" "$TGT_SHA"; then
    err "REFUSING TO ROLL FORWARD: target $TGT_SHA is a DESCENDANT of the live commit $CUR_SHA -- that would deploy newer/unreleased code, not roll back."
    err "If you really mean to ship $TGT_SHA, use scripts/deploy.sh $TGT_SHA (a forward deploy), not rollback.sh."
    exit 3
  fi
  if ! git -C "$SOURCE_REPO" merge-base --is-ancestor "$TGT_SHA" "$CUR_SHA"; then
    log "NOTE: target $TGT_SHA is not a linear ancestor of the live commit $CUR_SHA (divergent history). Allowed, but double-check the SHAs below."
  fi
else
  log "NOTE: could not resolve one of the SHAs in $SOURCE_REPO to check direction. Double-check the SHAs below before confirming."
fi

# --- Confirm ------------------------------------------------------------------
log "Rollback plan:"
echo "    FROM (live):   $CUR_SHA   $CURRENT_NOW"
echo "    TO   (target): $TGT_SHA   $TARGET"
echo "    unit:          ${SYSTEMD_UNIT:-<none, manual>}"
if [ "${ROLLBACK_ASSUME_YES:-}" != "1" ]; then
  if [ ! -t 0 ]; then
    err "Refusing to roll back non-interactively without ROLLBACK_ASSUME_YES=1 (no TTY to confirm on)."
    exit 4
  fi
  printf 'Type the TARGET short SHA (%s) to confirm rollback: ' "${TGT_SHA:0:7}"
  read -r reply
  if [ "$reply" != "${TGT_SHA:0:7}" ]; then
    err "Confirmation did not match (got '$reply'). Aborting -- nothing changed."
    exit 5
  fi
fi

# --- Swap + restart -----------------------------------------------------------
# Only now, after every guard passed, do we record where we're leaving from and
# move the symlink.
[ "$CURRENT_NOW" != "none" ] && echo "$CURRENT_NOW" > "$DEPLOY_ROOT/previous-release" || true
ln -sfn "$TARGET" "$CURRENT_LINK.tmp"
mv -Tf "$CURRENT_LINK.tmp" "$CURRENT_LINK"

if [ -n "$SYSTEMD_UNIT" ]; then
  log "Restarting $SYSTEMD_UNIT"
  sudo systemctl restart "$SYSTEMD_UNIT"
fi

log "Verifying running process reports the rolled-back commit ($TGT_SHA)"
for _ in $(seq 1 30); do
  RESPONSE="$(curl -s "http://127.0.0.1:3000/api/version" || true)"
  REPORTED_SHA="$(echo "$RESPONSE" | grep -o '"gitSha":"[^"]*"' | cut -d'"' -f4 || true)"
  if [ "$REPORTED_SHA" = "$TGT_SHA" ]; then
    log "Rollback complete. Live: $TARGET (gitSha=$REPORTED_SHA)"
    exit 0
  fi
  sleep 1
done
err "Rollback restarted but /api/version did not confirm $TGT_SHA (last: ${RESPONSE:-<none>}). Investigate: journalctl -u ${SYSTEMD_UNIT:-complivibe-frontend} -n 50"
exit 1
