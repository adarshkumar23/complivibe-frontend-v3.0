#!/usr/bin/env bash
# Instant rollback: repoint `current` at the previous release and restart.
#
# Because every deploy leaves the prior release on disk (releases/<sha>/) and
# records its path in $DEPLOY_ROOT/previous-release, rolling back is just an
# atomic symlink swap back + a restart -- no rebuild, seconds not minutes.
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
CURRENT_LINK="$DEPLOY_ROOT/current"
TARGET="${2:-}"

log() { echo "==> $*"; }
err() { echo "::error::$*" >&2; }

if [ -z "$TARGET" ]; then
  [ -f "$DEPLOY_ROOT/previous-release" ] || { err "No $DEPLOY_ROOT/previous-release recorded. Pass a release dir explicitly (ls -1dt $DEPLOY_ROOT/releases/*/)."; exit 1; }
  TARGET="$(cat "$DEPLOY_ROOT/previous-release")"
fi
[ -d "$TARGET" ] && [ -d "$TARGET/.next" ] || { err "Rollback target '$TARGET' is not a built release (no .next)."; exit 1; }

CURRENT_NOW="$(readlink -f "$CURRENT_LINK" 2>/dev/null || echo none)"
log "Rolling back: current ($CURRENT_NOW) -> $TARGET"

# Remember what we're leaving so a re-rollback (roll forward) is symmetric.
[ "$CURRENT_NOW" != "none" ] && echo "$CURRENT_NOW" > "$DEPLOY_ROOT/previous-release" || true

ln -sfn "$TARGET" "$CURRENT_LINK.tmp"
mv -Tf "$CURRENT_LINK.tmp" "$CURRENT_LINK"

if [ -n "$SYSTEMD_UNIT" ]; then
  log "Restarting $SYSTEMD_UNIT"
  sudo systemctl restart "$SYSTEMD_UNIT"
fi

EXPECT_SHA="$(grep -o 'NEXT_PUBLIC_GIT_SHA=.*' "$TARGET/deploy/current-version.env" 2>/dev/null | cut -d= -f2 || true)"
log "Verifying running process reports the rolled-back commit (${EXPECT_SHA:-unknown})"
for _ in $(seq 1 30); do
  RESPONSE="$(curl -s "http://127.0.0.1:3000/api/version" || true)"
  REPORTED_SHA="$(echo "$RESPONSE" | grep -o '"gitSha":"[^"]*"' | cut -d'"' -f4 || true)"
  if [ -n "$REPORTED_SHA" ] && { [ -z "$EXPECT_SHA" ] || [ "$REPORTED_SHA" = "$EXPECT_SHA" ]; }; then
    log "Rollback complete. Live: $TARGET (gitSha=$REPORTED_SHA)"
    exit 0
  fi
  sleep 1
done
err "Rollback restarted but /api/version did not confirm ${EXPECT_SHA:-the target commit} (last: ${RESPONSE:-<none>}). Investigate: journalctl -u ${SYSTEMD_UNIT:-complivibe-frontend} -n 50"
exit 1
