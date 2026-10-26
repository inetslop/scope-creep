# Scope Creep

An abstract, Bauhaus-style twin-stick roguelite for desktop and mobile browsers, built continuously by a fleet of local LLM agents.

- **The game** lives in [`game/`](game/): Phaser 3 + TypeScript + Vite. Deployed to GitHub Pages every 10 minutes.
- **The loop** around it: a Product Owner agent writes tasks, developer agents on three machines implement them, a browser smoke test gates every change.

```
                    tasks/<machine>/*.md
  ┌──────────────┐  (only the PO writes)  ┌──────────────────────────┐
  │ PO agent     │ ────────────────────▶ │ dev agents (one/machine) │
  │ asus, Q8     │                       │ asus Q8 · desktop Q4 ·   │
  │ planning/    │ ◀──── results ─────── │ yoga Q2                  │
  └──────────────┘  (runner writes them) └────────────┬─────────────┘
                                                      │ edit game/ only
                                                      ▼
                         gate: npm run check + browser smoke test (desktop + phone)
                                                      │ pass
                                                      ▼
                                  git push main ──▶ GitHub Pages (*/10 min)
```

## Who can change what

| Path | Dev agents | PO agent | Runner | Humans |
| --- | --- | --- | --- | --- |
| `game/` (except `game/CLAUDE.md`) | **write** | read | commits it | ✔ |
| `tasks/<machine>/` | no access | **write** new / `todo` tasks | status + results | ✔ |
| `planning/` | no access | **write** | — | ✔ |
| `loop/`, `agents/`, `setup/`, `.github/`, root files | no access | no access | — | ✔ |

Enforced twice: Claude Code permission rules (generated per run with absolute paths), and after every agent session the runner reverts any change outside the allowed paths and only ever stages those paths when it commits. The smoke test lives in `loop/`, so agents can run it but cannot weaken it.

## Setting up a machine

On each of the three Windows machines:

```powershell
git clone https://github.com/inetslop/scope-creep.git
cd scope-creep
powershell -NoProfile -ExecutionPolicy Bypass -File setup\setup.ps1
```

Setup is interactive and safe to re-run. It:
1. checks Git, installs **Node.js 24**, **GitHub CLI** (and logs you in), **Claude Code** — per user, no admin;
2. asks **which machine** this is (`asus`, `desktop`, `yoga` from `agents/machines.json`);
3. sets up the **model server**: picks a `llama-server.exe` already on the machine (Unsloth, LM Studio, earlier setup) or downloads the latest llama.cpp build for your GPU/arch, then searches a folder for `.gguf` files, filters by name (e.g. `qwen`) and lets you pick one. Context defaults to **auto** — or point it at an existing Anthropic-compatible server instead;
4. installs npm packages and Playwright Chromium;
5. optionally registers a logon task to start the loop automatically;
6. runs `npm run doctor`, which starts the model and checks git push, the Messages API, a Claude Code round trip and the full merge gate.

Then start the loop:

```powershell
npm run agent          # runs forever; restarts itself when loop code changes
```

## Day-to-day

| Command (repo root) | |
| --- | --- |
| `npm run agent` | start the loop on this machine (supervisor + runner) |
| `npm run status` | queues per machine, recent commits, model server health |
| `npm run doctor` | health check (`-- --gate` also runs the merge gate) |
| `New-Item .agent\STOP` | stop after the current task |
| `cd game; npm run dev` | play the latest local code |

Logs: `.agent\logs\` (runner, supervisor, llama-server). Full agent transcripts: `.agent\runs\*.jsonl`. Smoke screenshots: `.agent\smoke\`.

## How the loop works

Each machine runs `loop/start-agent.ps1`, a supervisor that keeps `loop/runner.ts` alive. Every iteration the runner:

1. **Syncs** with `origin/main`. If anything under `loop/` or the root `package*.json` changed, it exits with code 75 and the supervisor reinstalls dependencies and restarts it on the new code. (The supervisor also relaunches itself if `start-agent.ps1` changes.)
2. **Ensures the model server** is up (starts `llama-server` detached so the model stays loaded across restarts).
3. **PO cycle** (on the PO machine, when a queue is low, tasks finished, or every 90 min): runs the PO agent in the repo root with write access to `tasks/` and `planning/` only. The runner then validates every task file (format, unique ids, size vs. machine capability, never touching non-`todo` tasks), archives the tasks the PO just reviewed, commits and pushes.
4. **Dev task** (if this machine has a `todo` task in `tasks/<machine>/`):
   - claim it (status `in-progress`, pushed so everyone sees it);
   - run the dev agent in `game/` with the task text as its prompt;
   - revert anything outside `game/`;
   - **gate**: `npm run check` (typecheck, lint, unit tests) + **browser smoke test** (builds, then plays the game for ~24 s as a desktop player and as a phone with two-thumb touch; fails on any error, stalled frame loop, broken invariant, or if nothing gets shot); up to 2 fix rounds where the agent gets the failure output back;
   - **self-review** in a fresh session on the same machine (fixes kept only if the gate still passes);
   - rebase onto the latest main (the agent resolves code conflicts, the gate re-runs), push;
   - the runner writes the result (summary, diff stat, review verdict) or the failure reason into the task file. After 3 failed attempts a task is marked `failed`, and the PO sees why on its next cycle.

### Agents and the model

Agents are Claude Code in headless mode (`claude -p`) talking to the local model through llama.cpp's Anthropic-compatible API:

- **Dynamic context.** With context on `auto`, llama-server starts from the model's maximum and `--fit`s it to free memory (never below 32k). Before every agent session the runner asks the server what it is really running with (`/slots`, `/props`, or Ollama's `/api/ps`) and tells Claude Code, so it compacts before overflowing. Qwen 3.8 27B Q4 on the 5090 gets the full 262k.
- **Compatibility shim** (`loop/shim.ts`, inside the runner). Claude Code sends its environment section as a `system` message in the middle of the conversation; Qwen's chat template rejects that ("System message must be at the beginning"). The shim moves such messages into the leading system prompt and passes everything else through untouched.
- **Small, fixed toolset**: `Bash, Read, Edit, Write, Glob, Grep` only (no subagents, web, cron, worktrees…), which also keeps the prompt short.
- **Isolated**: own Claude config dir (`.agent\claude-home`), no MCP servers, no inherited `CLAUDE*`/`ANTHROPIC*` environment, auto-memory and attribution off, attribution header disabled (keeps llama.cpp's prompt cache warm).

## Repo map

```
game/            the game (agents' sandbox) — see game/CLAUDE.md
loop/            runner, supervisor, smoke test, doctor, status
agents/          machines.json (fleet + loop tuning) and prompt templates
setup/           setup.ps1
tasks/           <machine>/ queues and archive/ — PO + runner only
planning/        VISION, ROADMAP, IDEAS — PO-owned
.github/         Pages deployment
```

## Tuning

- `agents/machines.json` — per-machine task size limits, queue targets and notes the PO reads; turn limits and timeouts per task size; loop timings. Re-read every cycle, no restart needed.
- `agents/prompts/*.md` — what each agent is told. Re-read every run.
- `.agent/local.json` (per machine, from setup) — model path, model id, `ctxSize` (`0` = auto), llama-server args. Restart the model server after editing it: stop the runner, end `llama-server.exe`, start `npm run agent`.

## GitHub Pages

One-time: repo **Settings → Pages → Source: GitHub Actions**. The workflow runs every 10 minutes, skips if the live `version.json` already matches `main`, otherwise runs `npm run check`, builds and deploys `game/dist`.
