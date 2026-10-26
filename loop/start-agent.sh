#!/usr/bin/env bash
# Supervisor for the agent runner on Linux (the Docker agent's entrypoint). Same contract as
# start-agent.ps1 on Windows; keeps loop/runner.ts alive:
#   exit 0   clean stop (.agent/STOP file)  -> idle until the container is restarted (agent.sh start)
#   exit 75  loop code changed upstream     -> reinstall deps if needed, restart now
#   exit 76  model server unavailable       -> wait 60s, restart
#   other    crash                          -> git pull (a fix may have landed), back off, restart
# It also relaunches itself when this file changes on disk (after a git pull).
#
# A clean stop idles instead of exiting because Docker would restart an exited container.
set -u
cd "$(dirname "$0")/.."
mkdir -p .agent/logs
rm -f .agent/IDLE
self_hash=$(sha256sum "$0" | cut -d' ' -f1)

log() {
  local line
  line="$(date +%H:%M:%S) [supervisor] $*"
  echo "$line"
  echo "$line" >> .agent/logs/supervisor.log
}

sync_root_deps() {
  local hash old
  hash=$(sha256sum package-lock.json | cut -d' ' -f1)
  old=$(cat .agent/root-deps.sha 2>/dev/null || true)
  if [ "$hash" = "$old" ] && [ -d node_modules ]; then return; fi
  log 'loop dependencies changed: npm ci'
  if ! npm ci --no-audit --no-fund; then log 'npm ci failed'; return; fi
  npx playwright install chromium
  echo "$hash" > .agent/root-deps.sha
}

backoff=15
while true; do
  if [ "$(sha256sum "$0" | cut -d' ' -f1)" != "$self_hash" ]; then
    log 'start-agent.sh changed; relaunching the new version'
    exec bash "$0"
  fi
  sync_root_deps
  log 'starting runner'
  node loop/runner.ts
  code=$?
  case $code in
    0)
      log 'runner stopped cleanly; idle until the container restarts (agent.sh start)'
      touch .agent/IDLE
      exec sleep infinity
      ;;
    75)
      log 'runner restarting to load updated loop code'
      backoff=15
      ;;
    76)
      log 'model server unavailable; retrying in 60s (agent.sh logs llama)'
      sleep 60
      ;;
    *)
      log "runner crashed (exit $code); pulling latest and restarting in ${backoff}s"
      git pull --ff-only --quiet
      sleep "$backoff"
      backoff=$((backoff * 2 > 600 ? 600 : backoff * 2))
      ;;
  esac
done
