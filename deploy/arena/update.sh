#!/usr/bin/env bash
# Draft Arena's self-update, installed as /usr/local/sbin/arena-update by setup.sh and run by
# arena-update.timer every 5 minutes (as root; the build runs as the arena user).
#
#   1. Fetch main. Nothing to do when projects/draft-arena/game is the same tree as the live one.
#   2. Build that commit in /srv/arena/releases/<commit>: npm ci, npm run check, and the page for
#      this server (VITE_SERVER_URL=same-origin, VITE_BUILD_ID=<commit>). A tree whose check or
#      build fails is remembered in state/failed and never built again (the next change is).
#   3. Switch when nobody is playing (bots don't count), when nothing is live yet, or after the
#      release has waited MAX_WAIT_HOURS: point /srv/arena/current at it, restart arena.service,
#      wait for /status to report the new build, else roll back to the previous release.
#
# touch /srv/arena/state/hold to stop updates (after a manual rollback); remove it to resume.
set -euo pipefail

ROOT=/srv/arena
REPO="$ROOT/repo"
RELEASES="$ROOT/releases"
STATE="$ROOT/state"
GAME=projects/draft-arena/game
STATUS_URL=http://127.0.0.1:8790/status
MAX_WAIT_HOURS="${MAX_WAIT_HOURS:-12}"
KEEP=3

cd /
exec 9>"$STATE/update.lock"
flock -n 9 || { echo "another update is running"; exit 0; }
if [ -e "$STATE/hold" ]; then echo "on hold ($STATE/hold)"; exit 0; fi

as_arena() {
  runuser -u arena -- env -i HOME="$ROOT" PATH=/opt/node/bin:/usr/bin:/bin "$@"
}

as_arena git -C "$REPO" fetch --quiet origin main
tree=$(as_arena git -C "$REPO" rev-parse "origin/main:$GAME")
# The release is named after the last commit that changed the game, so pushes that only touch
# the rest of the repo (the fleet's other work) never build it again.
sha=$(as_arena git -C "$REPO" log -1 --format=%h --abbrev=12 origin/main -- "$GAME")
live_tree=$(cat "$STATE/live-tree" 2>/dev/null || true)
[ "$tree" != "$live_tree" ] || exit 0
if grep -qx "$tree" "$STATE/failed" 2>/dev/null; then exit 0; fi

dir="$RELEASES/$sha"
if [ ! -e "$dir/.built" ]; then
  echo "building $sha"
  # Its own bash, so set -e holds inside. Exit 10: the game itself failed (remembered); anything
  # else (GitHub or npm unreachable) is tried again next run.
  set +e
  as_arena npm_config_cache="$ROOT/npm-cache" SHA="$sha" DIR="$dir" REPO="$REPO" GAME="$GAME" bash -euo pipefail -c '
    rm -rf "$DIR"
    mkdir -p "$DIR"
    git -C "$REPO" archive "$SHA" "$GAME" | tar -x -C "$DIR"
    cd "$DIR/$GAME"
    npm ci --no-audit --no-fund
    npm run check || exit 10
    VITE_SERVER_URL=same-origin VITE_BUILD_ID="$SHA" npm run build || exit 10
    printf "BUILD_ID=%s\n" "$SHA" >"$DIR/arena.env"
    touch "$DIR/.built"
  '
  status=$?
  set -e
  if [ "$status" -ne 0 ]; then
    rm -rf "$dir"
    if [ "$status" -eq 10 ]; then
      echo "$tree" >>"$STATE/failed"
      echo "build $sha FAILED its check or build: not deployed, and not tried again"
    else
      echo "build $sha could not run (exit $status): trying again next time"
    fi
    exit 1
  fi
  echo "built $sha"
fi

previous=$(readlink -f "$ROOT/current" 2>/dev/null || true)
if [ -n "$previous" ]; then
  humans=$(curl -fsS --max-time 3 "$STATUS_URL" | jq -r '.humans' 2>/dev/null || echo 0)
  waited=$(( $(date +%s) - $(stat -c %Y "$dir/.built") ))
  if [ "${humans:-0}" != 0 ] && [ "$waited" -lt $((MAX_WAIT_HOURS * 3600)) ]; then
    echo "$sha is ready: waiting for the $humans player(s) online to leave"
    exit 0
  fi
fi

switch_to() {
  ln -sfn "$1" "$ROOT/current.new"
  mv -T "$ROOT/current.new" "$ROOT/current"
  systemctl restart arena.service
}

healthy() {
  local i
  for i in $(seq 20); do
    if [ "$(curl -fsS --max-time 2 "$STATUS_URL" 2>/dev/null | jq -r '.build' 2>/dev/null)" = "$1" ]; then return 0; fi
    sleep 1
  done
  return 1
}

echo "switching to $sha"
switch_to "$dir"
if ! healthy "$sha"; then
  echo "$tree" >>"$STATE/failed"
  journalctl -u arena.service -n 30 --no-pager || true
  if [ -n "$previous" ] && [ -d "$previous" ]; then
    echo "$sha did not come up: back to $(basename "$previous")"
    switch_to "$previous"
  else
    echo "$sha did not come up, and there is nothing to go back to"
  fi
  exit 1
fi
echo "$tree" >"$STATE/live-tree"
echo "live: $sha"

# Keep the live release, the one before it, and the newest others: KEEP in all.
kept=1
if [ -n "$previous" ] && [ "$previous" != "$dir" ]; then kept=2; fi
find "$RELEASES" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' | sort -rn | cut -d' ' -f2- |
  while IFS= read -r d; do
    if [ "$d" = "$dir" ] || [ "$d" = "$previous" ]; then continue; fi
    if [ "$kept" -lt "$KEEP" ]; then
      kept=$((kept + 1))
    else
      rm -rf "$d"
    fi
  done
