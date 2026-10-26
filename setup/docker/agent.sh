#!/usr/bin/env bash
# Scope Creep agent on Linux, in Docker. Run from any checkout of the repo:
#
#   setup/docker/agent.sh setup     set this PC up as an agent machine (safe to re-run)
#   setup/docker/agent.sh start     start the agent and its model server (also after a stop)
#   setup/docker/agent.sh stop      stop after the current task (graceful)
#   setup/docker/agent.sh down      stop now (an unfinished task is requeued on the next start)
#   setup/docker/agent.sh logs [agent|llama]
#   setup/docker/agent.sh status    queues, recent commits, model server health
#   setup/docker/agent.sh doctor [--gate]
#   setup/docker/agent.sh shell     a shell inside the agent container
#   setup/docker/agent.sh update    rebuild the agent image and pull the latest llama.cpp server
#
# Everything lives in one folder (default ~/scope-creep-agent, override with SCOPE_CREEP_AGENT_HOME):
#   repo/     the agent's own clone (it resets and pushes main: never point this at your working copy)
#   models/   GGUF files          home/   the container user's home (GitHub login, caches)
#   .env      docker compose settings written by setup
# Needs Docker with Compose v2 and, for the GPU, the NVIDIA Container Toolkit.
set -euo pipefail

AGENT_HOME="${SCOPE_CREEP_AGENT_HOME:-$HOME/scope-creep-agent}"
REPO_DIR="$AGENT_HOME/repo"
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$AGENT_HOME/.env"

if [ -t 1 ]; then c() { printf '\033[%sm%s\033[0m\n' "$1" "$2"; }; else c() { printf '%s\n' "$2"; }; fi
step() { echo; c 36 "== $*"; }
ok() { c 32 "   ok  $*"; }
note() { c 90 "   ..  $*"; }
problem() { c 33 "   !!  $*"; }
die() { problem "$*"; exit 1; }
yes_no() { # question default(y|n)
  local answer hint='y/N'; [ "$2" = y ] && hint='Y/n'
  read -r -p "   $1 ($hint) " answer || true
  answer="${answer:-$2}"; [[ "${answer,,}" == y* ]]
}

compose() {
  docker compose --project-name scope-creep-agent --env-file "$ENV_FILE" -f "$REPO_DIR/setup/docker/compose.yml" "$@"
}
in_agent() { compose run --rm --no-deps agent "$@"; }

set_env() { # KEY VALUE
  local tmp
  touch "$ENV_FILE"
  tmp=$(mktemp)
  grep -v "^$1=" "$ENV_FILE" > "$tmp" || true
  printf '%s="%s"\n' "$1" "${2//\"/\\\"}" >> "$tmp"
  mv "$tmp" "$ENV_FILE"
}

toolkit_help() {
  local distro
  distro=$(. /etc/os-release 2>/dev/null && echo "${ID:-}")
  problem 'Docker cannot use the GPU: install the NVIDIA Container Toolkit, then run setup again.'
  case "$distro" in
    arch | cachyos | endeavouros | manjaro) note 'sudo pacman -S --needed nvidia-container-toolkit' ;;
    *) note 'install nvidia-container-toolkit from NVIDIA: https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html' ;;
  esac
  note 'then: sudo nvidia-ctk runtime configure --runtime=docker && sudo systemctl restart docker'
  note '(restarting Docker restarts the containers it is running)'
  exit 1
}

cmd_setup() {
  step 'Prerequisites'
  command -v git >/dev/null || die 'git is not installed'
  command -v docker >/dev/null || die 'Docker is not installed (https://docs.docker.com/engine/install/)'
  docker info >/dev/null 2>&1 || die 'cannot talk to Docker: is it running, and are you in the "docker" group?'
  docker compose version >/dev/null 2>&1 || die 'Docker Compose v2 is missing: install the "docker-compose" package (Arch) or "docker-compose-plugin" (Debian, Ubuntu, Fedora)'
  ok "$(docker --version), $(docker compose version --short)"

  step 'GPU'
  local gpu=''
  if command -v nvidia-smi >/dev/null; then gpu=$(nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits 2>/dev/null || true); fi
  [ -n "$gpu" ] || die 'no NVIDIA GPU found (nvidia-smi). Only NVIDIA GPUs are supported in Docker for now.'
  ok "$gpu"

  step "Agent folder: $AGENT_HOME"
  mkdir -p "$AGENT_HOME/models" "$AGENT_HOME/home"
  if [ ! -d "$REPO_DIR/.git" ]; then
    local origin
    origin=$(git -C "$SRC_DIR" remote get-url origin) || die "no git remote 'origin' in $SRC_DIR"
    note "cloning $origin"
    git clone --quiet "$origin" "$REPO_DIR"
    ok "cloned into $REPO_DIR"
  else
    ok "using the existing clone in $REPO_DIR"
  fi
  if [ -f "$ENV_FILE" ] && compose ps --status running --services 2>/dev/null | grep -qx agent; then
    yes_no 'The agent is running. Stop it now for setup (an unfinished task is requeued)?' y || die 'setup cancelled'
    compose stop agent
  fi
  git -C "$REPO_DIR" pull --ff-only --quiet || problem "could not update $REPO_DIR (continuing with what it has)"
  set_env AGENT_HOME "$AGENT_HOME"
  set_env AGENT_UID "$(id -u)"
  set_env AGENT_GID "$(id -g)"
  set_env HOST_NAME "$(hostname)"
  set_env HOST_GPU "$gpu"
  local used llama_mib
  used=$(nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits 2>/dev/null | awk '{s+=$1} END {print s+0}')
  llama_mib=$(nvidia-smi --query-compute-apps=process_name,used_memory --format=csv,noheader,nounits 2>/dev/null | awk -F', *' '/llama-server/ {s+=$2} END {print s+0}')
  set_env HOST_VRAM_OTHER_MIB "$((used - llama_mib))"
  set_env PLAYWRIGHT_VERSION "$(sed -n 's/.*"playwright": *"\([^"]*\)".*/\1/p' "$REPO_DIR/package.json" | head -1)"

  step 'Docker images (first build and pull take a few minutes)'
  compose build agent
  compose pull llama
  ok 'agent image built, llama.cpp server image pulled'

  step 'GPU inside Docker'
  if compose run --rm --no-deps --entrypoint nvidia-smi llama -L; then ok 'containers can use the GPU'; else toolkit_help; fi

  step 'GitHub login (an account that can push to the repo)'
  in_agent bash -c 'gh auth status --hostname github.com >/dev/null 2>&1 || gh auth login --hostname github.com --git-protocol https --web; gh auth setup-git'
  ok 'git in the container pushes with this login'

  step 'Machine and model'
  rm -f "$AGENT_HOME/setup-result.json"
  in_agent node setup/docker/setup.ts
  [ -f "$AGENT_HOME/setup-result.json" ] || die 'setup did not finish'
  local machine is_new paused
  machine=$(sed -n 's/.*"machineId":"\([^"]*\)".*/\1/p' "$AGENT_HOME/setup-result.json")
  is_new=$(sed -n 's/.*"isNew":\(true\|false\).*/\1/p' "$AGENT_HOME/setup-result.json")
  paused=$(sed -n 's/.*"paused":\(true\|false\).*/\1/p' "$AGENT_HOME/setup-result.json")

  step 'Model server (loading a model can take a few minutes)'
  compose up -d llama
  if ! in_agent bash -c 'for i in $(seq 1 240); do curl -fsS http://llama:8080/health >/dev/null 2>&1 && exit 0; sleep 5; done; exit 1'; then
    compose logs --tail 40 llama
    die 'the model server did not become healthy (see above; agent.sh logs llama)'
  fi
  ok 'model loaded'

  step 'Health check: model, Claude Code, git push and the merge gate'
  if in_agent node loop/doctor.ts --gate; then
    if [ "$is_new" = true ]; then
      in_agent node setup/machine.ts unpause "$machine"
    elif [ "$paused" = true ] && yes_no "\"$machine\" is paused in agents/machines.json. Unpause it now that it works?" y; then
      in_agent node setup/machine.ts unpause "$machine"
    fi
  else
    [ "$paused" = true ] && problem "\"$machine\" stays paused in agents/machines.json until this passes"
    die "fix the problems above, then run: $0 setup"
  fi

  step 'Start'
  compose up -d agent
  ok "\"$machine\" is running. It restarts with Docker (and so after a reboot)."
  echo
  note "logs:   $0 logs        status: $0 status"
  note "stop:   $0 stop (after the current task)   now: $0 down"
}

need_setup() { [ -f "$ENV_FILE" ] && [ -d "$REPO_DIR/.git" ] || die "not set up yet: run $0 setup"; }

cmd="${1:-help}"
[ $# -gt 0 ] && shift
case "$cmd" in
  setup) cmd_setup ;;
  start)
    need_setup
    compose up -d
    if [ -f "$REPO_DIR/.agent/IDLE" ]; then compose restart agent; fi
    ok 'started'
    ;;
  stop)
    need_setup
    touch "$REPO_DIR/.agent/STOP"
    ok "the agent stops after its current task (watch: $0 logs). Stop right away: $0 down"
    ;;
  down) need_setup && compose down ;;
  logs) need_setup && compose logs -f --tail 200 "${1:-agent}" ;;
  status) need_setup && compose ps && compose exec agent node loop/status.ts ;;
  doctor) need_setup && compose exec agent node loop/doctor.ts "$@" ;;
  shell) need_setup && compose exec agent bash ;;
  update)
    need_setup
    yes_no 'Rebuild and restart now? The agent'"'"'s current task is interrupted (and requeued).' n || exit 0
    set_env PLAYWRIGHT_VERSION "$(sed -n 's/.*"playwright": *"\([^"]*\)".*/\1/p' "$REPO_DIR/package.json" | head -1)"
    compose build --pull agent
    compose pull llama
    compose up -d
    ;;
  *) sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//' ;;
esac
