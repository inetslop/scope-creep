# Scope Creep

An abstract, Bauhaus-style twin-stick roguelite for desktop and mobile browsers, built continuously by a fleet of local LLM agents.

- **The games**: the fleet works on one game at a time, set by `loop.project` in [`agents/machines.json`](agents/machines.json) (see *Projects*). The first, Scope Creep, lives in [`game/`](game/); every other one in `projects/<id>/` (now [Chokepoint](projects/chokepoint/game/), a roguelite tower defence, and [Draft Arena](projects/draft-arena/game/), a multiplayer .io arena with a frozen engine: the agents build its content and HUD, its netcode and server are human-owned). TypeScript + Vite; Phaser 3 for the single-player games. All of them are deployed to GitHub Pages every 10 minutes, each at `/<id>/` (Scope Creep at `/scope-creep/`).
- **The loop** around it: a Product Owner agent writes tasks, an architect agent designs each one against the real code, developer agents on several machines (Windows, or Linux in Docker) implement them, a browser smoke test gates every change.
- **The site** ([`site/`](site/)): the front page lists the games and what every machine of the fleet is doing (building or designing which task, idle, paused, its last push). Each game has a build log next to it (`/<id>/build-log/`, linked from the menu) listing every feature, which machine built it and how long it took. The deploy workflow generates both from runner-written records, so the agents can't change them.

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
| `game/` (except `game/CLAUDE.md` and a game's `engine/`) | **write** | read | no access (gets a generated inventory) | commits it | ✔ |
| `tasks/` (the shared pool) | no access | no access (gets its task in the prompt) | **write** new / `design` / `todo` tasks | claims, status, designs, results | ✔ |
| `planning/` | no access | no access | **write** | — | ✔ |
| `loop/`, `agents/`, `setup/`, `site/`, `deploy/`, `.github/`, root files | no access | no access | no access | — | ✔ |

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

**GPU placement.** With a fixed context size (not `auto`), a `q8_0` or `q4_0` context cache and one NVIDIA GPU, the runner places the model like the Docker agent does (see *GPU placement* under Linux) whenever it starts llama-server: every layer and the whole context cache on the GPU, just enough of the largest feed-forward weights on the CPU for the VRAM free at that moment, with `-ub 256 --load-mode none`. The runner log says what it chose. `llama.gpuMarginMib` in `.agent\local.json` (640) is the VRAM it leaves free; your own placement flags in `extraArgs` (`-ngl`, `-ot`, `--fit`, …) turn it off. If llama-server dies while loading that way (an older build, or VRAM taken meanwhile), the runner retries with llama.cpp's `--fit`. Unlike Linux, the Windows NVIDIA driver spills into shared system memory when VRAM runs out, so a too-tight fit runs slowly instead of failing: set *CUDA - Sysmem Fallback Policy* to *Prefer No Sysmem Fallback* for `llama-server.exe` in the NVIDIA Control Panel to make it fail, and fall back, instead. To re-place after closing apps: `New-Item .agent\STOP`, wait for the loop to stop, then `Stop-Process -Name llama-server` and `npm run agent`.

### Linux (Docker)

Needs Docker with Compose v2, an NVIDIA GPU and the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) (setup checks and tells you what is missing). From any checkout:

```bash
setup/docker/agent.sh setup
```

It creates `~/scope-creep-agent/` (override with `SCOPE_CREEP_AGENT_HOME`) with the agent's **own clone** of the repo (the runner resets and pushes `main`, so it never uses your working copy), a `models/` folder and the container's home. Two containers run from `setup/docker/compose.yml`: **agent** (Node 24, git, GitHub CLI, Claude Code and Chromium's libraries; the repo is mounted, so the runner still updates itself with git) and **llama** (the official `llama.cpp:server-cuda` image, reachable only from the agent). Setup builds the image, checks the GPU works inside Docker, logs the container in to GitHub (device code), asks which machine this is (or registers it), lets you pick a GGUF in `models/` or download one, asks for the context cache precision (`q8_0` or `q4_0`) and context size while showing how much of the model each choice leaves on the GPU (llama.cpp gets one request slot: the runner only runs one session), waits for the model, runs the doctor with the merge gate, unpauses a new machine and starts it. Both containers restart with Docker, so after a reboot too.

**GPU placement.** At every start the llama container (`setup/docker/llama-start.sh`) checks the free VRAM and keeps every layer and the whole context cache on the GPU, moving just enough of the largest feed-forward weights to the CPU (`-ot`). llama.cpp's own `--fit` moves whole layers, cache included, which is far slower (Unsloth measured cache on the CPU at ~20× the cost per byte). On the RTX 4070 SUPER at 64k context this took Qwen3.8-27B IQ3_XXS from ~14 to ~20 tokens/s with the desktop's apps closed. Setup records the model's layout in `LLAMA_GPU_PLAN`; `LLAMA_GPU_MARGIN_MIB` (640) is the VRAM it leaves free.

| `setup/docker/agent.sh …` | |
| --- | --- |
| `start` / `stop` / `down` | start (also after a stop) / stop after the current task / stop now (the task is requeued) |
| `logs [agent\|llama]`, `status`, `doctor [--gate]`, `shell` | watch and inspect |
| `refit` | restart the model server so it re-places the model by the VRAM free now: after closing apps more of it goes on the GPU (faster), after opening them it makes room |
| `update` | rebuild the agent image (new Claude Code) and pull the latest llama.cpp server |

### Adding a machine

Machines aren't hard-coded: choose **a new machine** in either setup. It detects the CPU, GPU, VRAM and RAM, and suggests an id (from the hostname), a label and, from the model's quant and whether it fits in VRAM, a tier, the biggest task size, a queue target and notes for the PO; press Enter to accept or type over each. It then commits the entry to `agents/machines.json` and pushes it as **`"paused": true`**, so the PO plans nothing for it, and the running machines carry on undisturbed, until the doctor has passed on the new machine; setup then unpauses it. By hand: `node setup/machine.ts register --model-file <gguf>`, `node setup/machine.ts unpause <id>`.

## Day-to-day

| Command (repo root) | |
| --- | --- |
| `npm run agent` | start the loop on this machine (supervisor + runner) |
| `npm run status` | what each machine is doing, the shared pool (✎ waiting for design, ✍ being designed, · ready, ▶ in progress, with the files each ▶ task touches), recent commits, model server health |
| `npm run doctor` | health check (`-- --gate` also runs the merge gate) |
| `New-Item .agent\STOP` | stop after the current task |
| `"paused": true` in `agents/machines.json` | take a machine out of the loop while it's down: its runner idles (no model server, no work), the PO stops planning for it, and the other machines take the pool's tasks. A task it had `in-progress` stays its own for an hour after the pause (`pausedAt`, set by `node setup/machine.ts pause <id>`), so it can finish it; then the PO machine puts it back in the pool and its files unlock. If the machine finishes it later anyway, it saves the work to `tasks/salvage/` for the next attempt instead of pushing |
| `"project": "<id>"` in `loop` of `agents/machines.json` | switch the whole fleet to another game (see *Projects*) |
| `cd game; npm run dev` | play the latest local code (`cd projects/<id>/game` for another project) |

## Projects

The fleet builds one game at a time: `loop.project` in `agents/machines.json` (default `scope-creep`). Each project has the same three folders: `game/` (the code), `planning/` (the PO's docs) and `tasks/` (the shared task pool and archive). Scope Creep's are at the repo root; every other project's are in `projects/<id>/`. The loop's per-game parts live outside them, where agents can't change them: the smoke test's play and checks in `loop/smoke/games/<id>.ts`, and the agents' prompts in `agents/prompts/<id>/` (any prompt a project doesn't have, like `fix.md`, comes from `agents/prompts/`). Agents can't see the other projects. Runner state is per project (`.agent/state-<id>.json`), so a new project starts with a fresh PO cycle.

**Switching** is one push that changes `loop.project`. Each runner picks it up at its next sync, after it has pushed the task it is on, and restarts on the new project. The old project's open tasks stay where they are, parked, until the fleet switches back. To start without leftover work, pause every machine first, wait until nothing is ▶ in `npm run status`, then unpause them in the same push that switches.

**A new project** needs `projects/<id>/game/` (a game with `npm run check`, `npm run build` and the `window.__SC__` hook the smoke test reads: `ready`, `scene`, `frame`, `errors`, `invariants()`, `stats`), `projects/<id>/planning/` (`VISION.md`, `ROADMAP.md`, `IDEAS.md`, `CHANGELOG.md`), `loop/smoke/games/<id>.ts` and `agents/prompts/<id>/`. The deploy publishes Scope Creep at the site root and every other project at `/<id>/`, each with its own build log.

**Editing the game by hand** while the loop runs: a big change to files that a ▶ task in `npm run status` touches will conflict with it. Pause that machine first (it finishes and pushes its current task, then idles; after an hour the task goes back to the pool), make your change, then unpause it.

Logs: `.agent\logs\` (runner, supervisor, llama-server). Full agent transcripts: `.agent\runs\*.jsonl`. Smoke screenshots: `.agent\smoke\`.

## How the loop works

Each machine runs `loop/start-agent.ps1`, a supervisor that keeps `loop/runner.ts` alive. Every iteration the runner:

1. **Syncs** with `origin/main`. If anything under `loop/` or the root `package*.json` changed, it exits with code 75 and the supervisor reinstalls dependencies and restarts it on the new code. (The supervisor also relaunches itself if `start-agent.ps1` changes.)
2. **Ensures the model server** is up (starts `llama-server` detached so the model stays loaded across restarts).
3. **Task inbox** (on the PO machine, every loop, before the PO cycle): a task file without an id dropped into `<project>/tasks/inbox/` (by a human, a script, another session) is numbered with the next free id and moved into the pool as a `design` task, in one commit (`loop/inbox.ts`; the format is in the folder's `README.md`). Only the PO machine hands out ids, for these and for its own cycles, so two tasks never get the same number. Add tasks this way instead of picking an id by hand: a PO cycle that is running has already reserved the next 12.
4. **PO cycle** (on the PO machine, see *Pacing* below): runs the PO agent in the repo root with write access to `tasks/` and `planning/` only. The PO never reads the game's code — it plans from the vision, roadmap, ideas, `planning/CHANGELOG.md` and a game inventory the runner generates from the content files and source tree (enemies, weapons, upgrades, scenes, systems). Before each cycle the runner also moves roadmap history (done epics, old cycle notes) to `planning/archive/`, and writes the **module docs** in `planning/modules/`: one per gameplay module, a human-written guide from `agents/prompts/<project>/modules/<module>.md` (what the module is, its bar for new content, what a task for it must contain) followed by everything that exists in it, loaded from the game's content registry and indexed by shared mechanic (frontmatter: `summary`, `content`, `group_by`). Add a module by adding a guide there; the PO reads the doc before tasking that module, and the architect rejects new content whose "Compared with what exists" table misses an item that shares its mechanic. The runner then validates every task file (format, unique ids, size vs. machine capability, the PO may only edit `design`/`todo` tasks), sets new tasks to `design`, appends finished tasks to the changelog, archives the tasks the PO just reviewed, commits and pushes.
5. **Architect pass**: a read-only agent in `game/` reads the code and answers with a design — files to create/edit, exact interfaces, steps, pitfalls, tests, and dependencies on other open tasks. The runner appends it to the task as `## Design`, adds the dependencies and moves the task to `todo`. If the task can't be built as written, the architect rejects it and it goes back to the PO as `failed` with the reason.
   - **Who designs** (`architectMode` / `devMode` / `maxDesignSize` in `agents/machines.json`): the desktop is the main architect and, like planning, does it full time (`devMode: "idle"`): every iteration it plans if the PO is due, then designs every waiting task (best priority first, up to 4 before re-checking the PO), and only builds a task of its own when there is nothing to plan or design. Machines with `architectMode: "idle"` build first and design one task (their own first) only when they have nothing ready to build. `maxDesignSize` caps what an architect designs: the yoga designs only `S` tasks, and does it first (`devMode: "idle"`, like the desktop): it builds only when no small task is waiting for a design. A bigger architect leaves tasks a smaller one covers to it for `loop.designGraceMinutes` (20) before taking them, so the desktop spends its time on the big work while small tasks don't wait on it.
   - **Claims**: before designing, an architect pushes `status: designing` + `designer: <machine>`, so two architects never design the same task. A runner releases its own claims when it restarts, and a claim older than the architect timeout + 30 min is taken over by anyone (the claimer probably died).
6. **Dev task**: tasks wait in one shared pool, `tasks/<id>-<slug>.md`, and every machine claims what it can take (`pickTaskFor` in `loop/tasks.ts`): a `todo` task whose dependencies are done and whose size is within the machine's `maxTaskSize`; best priority first, then the biggest size it can take (big machines on big work), then the lowest id. A bigger machine leaves a task that a smaller running machine could also build to it for `loop.claimGraceMinutes` (default: `designGraceMinutes`, 20), so the weak machines always have work. No machine waits on another's queue, and one that is down simply takes nothing. (Older tasks may still sit in `tasks/<machine>/` folders; only that machine takes those, first.)
   - claim it (status `in-progress` + `assignee: <machine>`, pushed so everyone sees it; if someone else claimed it first, the push finds it taken and the machine picks again);
   - run the dev agent in `game/` with the task (including the architect's design) as its prompt;
   - revert anything outside `game/`;
   - **gate**: `npm run check` (typecheck, lint, unit tests) + **browser smoke test** (builds, then plays the game for ~24 s as a desktop player and as a phone with two-thumb touch; fails on any error, stalled frame loop, broken invariant, or if nothing gets shot); up to 2 fix rounds where the agent gets the failure output back;
   - **self-review** in a fresh session on the same machine (fixes kept only if the gate still passes);
   - rebase onto the latest main (conflict markers include the common ancestor), push. Spots where both sides only added lines are resolved by keeping both (`loop/merge.ts`); an agent resolves the rest, given the task and the messages of the commits on main that caused them; the gate re-runs. If the work still can't be merged, the runner saves its diff to `tasks/salvage/<id>.diff` and the next attempt re-applies it instead of starting over (the file goes when the task is archived);
   - the runner writes the result (summary, diff stat, review verdict) or the failure reason into the task file. A failed attempt puts the task back in the pool for any machine to retry (the attempt's section says who tried); after 3 failed attempts it is marked `failed`, and the PO sees why on its next cycle.

### Pacing: how much the PO plans

The PO doesn't generate tasks continuously. It works by backpressure on the shared pool (`poolNeeds` in `loop/po.ts`): the running dev machines' `targetQueue`s in `agents/machines.json` add up to what the pool wants, and the waiting tasks (`design` to `todo`) that will get built are what it has. A chain of dependencies in the pool counts in full (anyone builds it in order); a task waiting on a failed or missing one doesn't. On top, every smaller size some running machine is limited to (the yoga takes only `S`) needs its own share, so the weak machines always have something they can take. The PO runs when:

- the pool, or its share of small tasks, is below what the machines want — and it writes exactly enough tasks to refill it;
- tasks finished (done, failed or rejected) and need reviewing;
- 90 minutes passed (`poMaxGapMinutes`) — a scheduled review of the roadmap and ideas, even if queues are full;

…but never more often than every 5 minutes (`poMinGapMinutes`). Fast machines drain the pool faster, so it gets refilled more often; the pool is short on purpose so plans stay fresh. To give the fleet more buffer, raise the machines' `targetQueue`.

### Agents and the model

Agents are Claude Code in headless mode (`claude -p`) talking to the local model through llama.cpp's Anthropic-compatible API:

- **Dynamic context.** With context on `auto`, llama-server starts from the model's maximum and `--fit`s it to free memory (never below 32k). Before every agent session the runner asks the server what it is really running with (`/slots`, `/props`, or Ollama's `/api/ps`) and tells Claude Code, so it compacts before overflowing. Qwen 3.8 27B Q4 on the 5090 gets the full 262k.
- **Compatibility shim** (`loop/shim.ts`, inside the runner). Claude Code sends its environment section as a `system` message in the middle of the conversation; Qwen's chat template rejects that ("System message must be at the beginning"). The shim moves such messages into the leading system prompt and passes everything else through untouched.
- **Sampling** (`loop.sampling` in `agents/machines.json`, overridable per machine with `sampling`): the shim writes it into every request, so a push changes it without restarting any model server. Only `temperature`, `top_p` and `top_k`: llama.cpp's `/v1/messages` endpoint drops other sampling fields, so `presence_penalty` and `min_p` are llama-server start-up arguments in the machine's local config (`extraArgs` in `.agent/local.json`, or `LLAMA_CUSTOM_ARGS` in the Docker agent's `.env`). The fleet uses Qwen3.8's thinking-mode recommendation (temperature 1.0, top_p 0.95, top_k 20); the 2- and 3-bit machines run with `--presence-penalty 1.0` against repetitive reasoning.
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
site/            the front page and the build log pages (generated at deploy time, humans only)
tasks/           the shared pool (<id>-<slug>.md), archive/, salvage/ (unmerged work kept for a retry), inbox/ (tasks without an id: see below) — PO + runner only
planning/        VISION, ROADMAP, IDEAS, CHANGELOG — PO-owned (the runner appends to CHANGELOG)
.github/         Pages deployment
deploy/          the live game server: Draft Arena's home box, its setup and self-update (humans only)
```

## Tuning

- `agents/machines.json` — per-machine task size limits, pool targets and notes the PO reads; turn limits and timeouts per task size; loop timings. Re-read every cycle, no restart needed.
- `agents/prompts/*.md` — what each agent is told. Re-read every run.
- `.agent/local.json` (per machine, from setup) — model path, model id, `ctxSize` (`0` = auto), llama-server args. Restart the model server after editing it: stop the runner, end `llama-server.exe`, start `npm run agent`.

## GitHub Pages

One-time: repo **Settings → Pages → Source: GitHub Actions**. The workflow runs every 10 minutes, skips if the live `version.json` already matches `main`, otherwise runs `npm run check` and builds every game, puts each at `/<id>/` (`game/dist` at `/scope-creep/`), writes the front page and `version.json` at the root (`site/home.ts`) and deploys.
