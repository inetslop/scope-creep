# Scope Creep

An abstract, Bauhaus-style twin-stick roguelite for desktop and mobile browsers, built continuously by a fleet of local LLM agents.

- **The game** lives in [`game/`](game/): Phaser 3 + TypeScript + Vite. Deployed to GitHub Pages every 10 minutes.
- **The loop** around it: a Product Owner agent writes tasks, an architect agent designs each one against the real code, developer agents on several machines (Windows, or Linux in Docker) implement them, a browser smoke test gates every change.
- **The build log** ([`site/`](site/)): a public page next to the game (`/build-log/`, linked from the menu) listing every feature, which machine built it and how long it took. The deploy workflow generates it from runner-written records, so the agents can't change it.

```
  ┌────────────┐ design  ┌─────────────────┐  todo   ┌──────────────────────────┐
  │ PO agent   │───────▶ │ architect agent │───────▶ │ dev agents (one/machine) │
  │ desktop,Q4 │ (what,  │ desktop Q4,     │ (+ ##   │ asus Q8 · yoga Q2 ·      │
  │ planning/  │  why)   │ read-only       │ Design) │ desktop Q4 when idle     │
  └─────▲──────┘         └───────┬─────────┘         └────────────┬─────────────┘
        │   rejections / results │ (the runner writes             │ edit game/ only
        └────────────────────────┴──  every status change)        ▼
                              gate: npm run check + browser smoke test (desktop + phone)
                                                                  │ pass
                                                                  ▼
                                              git push main ──▶ GitHub Pages (*/10 min)
```

## Who can change what

| Path | Dev agents | Architect | PO agent | Runner | Humans |
| --- | --- | --- | --- | --- | --- |
| `game/` (except `game/CLAUDE.md`) | **write** | read | no access (gets a generated inventory) | commits it | ✔ |
| `tasks/<machine>/` | no access | no access (gets its task in the prompt) | **write** new / `design` / `todo` tasks | status, designs, results | ✔ |
| `planning/` | no access | no access | **write** | — | ✔ |
| `loop/`, `agents/`, `setup/`, `site/`, `.github/`, root files | no access | no access | no access | — | ✔ |

Enforced twice: Claude Code permission rules (generated per run with absolute paths), and after every agent session the runner reverts any change outside the allowed paths and only ever stages those paths when it commits. The smoke test lives in `loop/`, so agents can run it but cannot weaken it.

## Setting up a machine

### Windows

```powershell
git clone https://github.com/inetslop/scope-creep.git
cd scope-creep
powershell -NoProfile -ExecutionPolicy Bypass -File setup\setup.ps1
```

Setup is interactive and safe to re-run. It:
1. checks Git, installs **Node.js 24**, **GitHub CLI** (and logs you in), **Claude Code** — per user, no admin;
2. asks **which machine** this is: one already in `agents/machines.json`, or **a new machine** (see *Adding a machine* below);
3. sets up the **model server**: picks a `llama-server.exe` already on the machine (Unsloth, LM Studio, earlier setup) or downloads the latest llama.cpp build for your GPU/arch, then either searches a folder for `.gguf` files or **downloads a model from Hugging Face** (it lists the repo's quants with their size and how well each fits this PC; resumable, checksum-verified). Context defaults to **auto** — or point it at an existing Anthropic-compatible server instead;
4. installs npm packages and Playwright Chromium;
5. optionally registers a logon task to start the loop automatically;
6. runs `npm run doctor`, which starts the model and checks git push, the Messages API, a Claude Code round trip and the full merge gate. A paused machine is unpaused when it passes (asked first for machines that were already registered).

Then start the loop:

```powershell
npm run agent          # runs forever; restarts itself when loop code changes
```

### Linux (Docker)

Needs Docker with Compose v2, an NVIDIA GPU and the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) (setup checks and tells you what is missing). From any checkout:

```bash
setup/docker/agent.sh setup
```

It creates `~/scope-creep-agent/` (override with `SCOPE_CREEP_AGENT_HOME`) with the agent's **own clone** of the repo (the runner resets and pushes `main`, so it never uses your working copy), a `models/` folder and the container's home. Two containers run from `setup/docker/compose.yml`: **agent** (Node 24, git, GitHub CLI, Claude Code and Chromium's libraries; the repo is mounted, so the runner still updates itself with git) and **llama** (the official `llama.cpp:server-cuda` image, reachable only from the agent). Setup builds the image, checks the GPU works inside Docker, logs the container in to GitHub (device code), asks which machine this is (or registers it), lets you pick a GGUF in `models/` or download one, asks for the context cache precision (`q8_0` or `q4_0`) and context size while showing how much of the model each choice leaves on the GPU (llama.cpp gets one request slot: the runner only runs one session), waits for the model, runs the doctor with the merge gate, unpauses a new machine and starts it. Both containers restart with Docker, so after a reboot too.

| `setup/docker/agent.sh …` | |
| --- | --- |
| `start` / `stop` / `down` | start (also after a stop) / stop after the current task / stop now (the task is requeued) |
| `logs [agent\|llama]`, `status`, `doctor [--gate]`, `shell` | watch and inspect |
| `update` | rebuild the agent image (new Claude Code) and pull the latest llama.cpp server |

### Adding a machine

Machines aren't hard-coded: choose **a new machine** in either setup. It detects the CPU, GPU, VRAM and RAM, and suggests an id (from the hostname), a label and, from the model's quant and whether it fits in VRAM, a tier, the biggest task size, a queue target and notes for the PO; press Enter to accept or type over each. It then commits the entry to `agents/machines.json` and pushes it as **`"paused": true`**, so the PO plans nothing for it, and the running machines carry on undisturbed, until the doctor has passed on the new machine; setup then unpauses it. By hand: `node setup/machine.ts register --model-file <gguf>`, `node setup/machine.ts unpause <id>`.

## Day-to-day

| Command (repo root) | |
| --- | --- |
| `npm run agent` | start the loop on this machine (supervisor + runner) |
| `npm run status` | queues per machine (✎ waiting for design, ✍ being designed, · ready, ▶ in progress), recent commits, model server health |
| `npm run doctor` | health check (`-- --gate` also runs the merge gate) |
| `New-Item .agent\STOP` | stop after the current task |
| `"paused": true` in `agents/machines.json` | take a machine out of the loop while it's down: its runner idles (no model server, no work) and nobody plans or assigns tasks for it. Move its open tasks to another machine's `tasks/<machine>/` folder (an `in-progress` one back to `todo`) |
| `cd game; npm run dev` | play the latest local code |

Logs: `.agent\logs\` (runner, supervisor, llama-server). Full agent transcripts: `.agent\runs\*.jsonl`. Smoke screenshots: `.agent\smoke\`.

## How the loop works

Each machine runs `loop/start-agent.ps1`, a supervisor that keeps `loop/runner.ts` alive. Every iteration the runner:

1. **Syncs** with `origin/main`. If anything under `loop/` or the root `package*.json` changed, it exits with code 75 and the supervisor reinstalls dependencies and restarts it on the new code. (The supervisor also relaunches itself if `start-agent.ps1` changes.)
2. **Ensures the model server** is up (starts `llama-server` detached so the model stays loaded across restarts).
3. **PO cycle** (on the PO machine, see *Pacing* below): runs the PO agent in the repo root with write access to `tasks/` and `planning/` only. The PO never reads the game's code — it plans from the vision, roadmap, ideas, `planning/CHANGELOG.md` and a game inventory the runner generates from the content files and source tree (enemies, weapons, upgrades, scenes, systems). The runner then validates every task file (format, unique ids, size vs. machine capability, the PO may only edit `design`/`todo` tasks), sets new tasks to `design`, appends finished tasks to the changelog, archives the tasks the PO just reviewed, commits and pushes.
4. **Architect pass**: a read-only agent in `game/` reads the code and answers with a design — files to create/edit, exact interfaces, steps, pitfalls, tests, and dependencies on other open tasks. The runner appends it to the task as `## Design`, adds the dependencies and moves the task to `todo`. If the task can't be built as written, the architect rejects it and it goes back to the PO as `failed` with the reason.
   - **Who designs** (`architectMode` / `devMode` / `maxDesignSize` in `agents/machines.json`): the desktop is the main architect and, like planning, does it full time (`devMode: "idle"`): every iteration it plans if the PO is due, then designs every waiting task (best priority first, up to 4 before re-checking the PO), and only builds a task of its own when there is nothing to plan or design. Machines with `architectMode: "idle"` build first and design one task (their own first) only when they have nothing ready to build. `maxDesignSize` caps what an architect designs: the yoga designs only `S` tasks, and does it first (`devMode: "idle"`, like the desktop): it builds only when no small task is waiting for a design. A bigger architect leaves tasks a smaller one covers to it for `loop.designGraceMinutes` (20) before taking them, so the desktop spends its time on the big work while small tasks don't wait on it.
   - **Claims**: before designing, an architect pushes `status: designing` + `designer: <machine>`, so two architects never design the same task. A runner releases its own claims when it restarts, and a claim older than the architect timeout + 30 min is taken over by anyone (the claimer probably died).
5. **Dev task** (if this machine has a `todo` task in `tasks/<machine>/` whose dependencies are done):
   - claim it (status `in-progress`, pushed so everyone sees it);
   - run the dev agent in `game/` with the task (including the architect's design) as its prompt;
   - revert anything outside `game/`;
   - **gate**: `npm run check` (typecheck, lint, unit tests) + **browser smoke test** (builds, then plays the game for ~24 s as a desktop player and as a phone with two-thumb touch; fails on any error, stalled frame loop, broken invariant, or if nothing gets shot); up to 2 fix rounds where the agent gets the failure output back;
   - **self-review** in a fresh session on the same machine (fixes kept only if the gate still passes);
   - rebase onto the latest main (the agent resolves code conflicts, the gate re-runs), push;
   - the runner writes the result (summary, diff stat, review verdict) or the failure reason into the task file. After 3 failed attempts a task is marked `failed`, and the PO sees why on its next cycle.

### Pacing: how much the PO plans

The PO doesn't generate tasks continuously. It works by backpressure: every dev machine has a `targetQueue` in `agents/machines.json` (asus 2, desktop 2, yoga 3), counting its `design` + `todo` tasks. The PO runs when:

- some machine's queue is below its target — and it writes exactly enough tasks to refill it;
- tasks finished (done, failed or rejected) and need reviewing;
- 90 minutes passed (`poMaxGapMinutes`) — a scheduled review of the roadmap and ideas, even if queues are full;

…but never more often than every 10 minutes (`poMinGapMinutes`). A machine that finishes tasks faster drains its queue faster and so gets refilled more often; a slow machine's queue just stays full. Queues are short on purpose so plans stay fresh. To give a machine more buffer, raise its `targetQueue`.

### Agents and the model

Agents are Claude Code in headless mode (`claude -p`) talking to the local model through llama.cpp's Anthropic-compatible API:

- **Dynamic context.** With context on `auto`, llama-server starts from the model's maximum and `--fit`s it to free memory (never below 32k). Before every agent session the runner asks the server what it is really running with (`/slots`, `/props`, or Ollama's `/api/ps`) and tells Claude Code, so it compacts before overflowing. Qwen 3.8 27B Q4 on the 5090 gets the full 262k.
- **Compatibility shim** (`loop/shim.ts`, inside the runner). Claude Code sends its environment section as a `system` message in the middle of the conversation; Qwen's chat template rejects that ("System message must be at the beginning"). The shim moves such messages into the leading system prompt and passes everything else through untouched.
- **Reasoning effort per role** (`loop.effort` in `agents/machines.json`, overridable per machine). Qwen 3.8's chat template supports exactly `low`, `medium` and `xhigh` (`high` is an alias of `xhigh`; anything else is rejected). llama.cpp ignores Claude Code's own effort setting, so the shim sets `chat_template_kwargs.reasoning_effort` on every request. PO, architect and devs all run at `xhigh`.
- **Patient timeouts for xhigh thinking**: 1 h / 2 h / 4 h per task by size (S/M/L), 2 h for PO and architect sessions, fix and review rounds get the full budget, 60 min per model request, 20 min per shell command.
- **Small, fixed toolset**: `Bash, Read, Edit, Write, Glob, Grep` only (the architect gets no Edit/Write; no subagents, web, cron, worktrees…), which also keeps the prompt short.
- **Isolated**: own Claude config dir (`.agent\claude-home`), no MCP servers, no inherited `CLAUDE*`/`ANTHROPIC*` environment, auto-memory and attribution off, attribution header disabled (keeps llama.cpp's prompt cache warm).

## Repo map

```
game/            the game (agents' sandbox) — see game/CLAUDE.md
loop/            runner, supervisor, smoke test, doctor, status
agents/          machines.json (fleet + loop tuning) and prompt templates
setup/           setup.ps1
site/            the public build log page (generated at deploy time, humans only)
tasks/           <machine>/ queues and archive/ — PO + runner only
planning/        VISION, ROADMAP, IDEAS, CHANGELOG — PO-owned (the runner appends to CHANGELOG)
.github/         Pages deployment
```

## Tuning

- `agents/machines.json` — per-machine task size limits, queue targets and notes the PO reads; turn limits and timeouts per task size; loop timings. Re-read every cycle, no restart needed.
- `agents/prompts/*.md` — what each agent is told. Re-read every run.
- `.agent/local.json` (per machine, from setup) — model path, model id, `ctxSize` (`0` = auto), llama-server args. Restart the model server after editing it: stop the runner, end `llama-server.exe`, start `npm run agent`.

## GitHub Pages

One-time: repo **Settings → Pages → Source: GitHub Actions**. The workflow runs every 10 minutes, skips if the live `version.json` already matches `main`, otherwise runs `npm run check`, builds and deploys `game/dist`.
