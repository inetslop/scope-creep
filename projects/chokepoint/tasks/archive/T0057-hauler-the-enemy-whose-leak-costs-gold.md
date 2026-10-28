---
id: T0057
title: "Hauler: the enemy whose leak costs gold"
size: M
priority: 2
status: failed
depends_on: [T0046, T0053]
attempts: 0
created: 2026-10-28T13:04:03Z
claimed_at: 2026-10-28T15:35:48Z
finished_at: 2026-10-28T16:31:26Z
design_attempts: 2
---

## Goal
A big slow walker with a small fortune inside: killing it pays a few slots' worth in one pop, and letting it through costs gold as well as a life — the first enemy worth more dead than alive, and the first whose leak costs gold.

## Details
- **Closest existing enemy:** Block (a plain slow walker). **What is new:** the economy — no enemy today costs anything but a life when it leaks, and none pays more than a few gold when killed; the Hauler makes a wave's gold a two-way risk.
- **Look:** a fat round token — a round shape no current enemy has — about 1.3× Block's size (the Mute's size class, a different silhouette), with the usual darker side face and soft shadow. Color: deep purple (check the content folder; if purple is taken by a landed enemy — the Dasher, T0046 — take the next free warm color, preferring a darker shade of it so the Hauler reads as its own token next to the Sprinter's orange; the Hauler stays warm: red, orange or purple).
- **Stats:** Block's speed, 3× Block's hp. Kills pay 10 gold (a few slots' worth for one kill) in the normal gold pop. It takes everything that works today — shots, beams, roots, pushes, marks, burns — including Mark's bonus damage.
- **Leak:** a leaking Hauler costs 1 life and 5 gold (gold never goes below 0), and the cost is seen where it happens: a small red "−5" pops at the exit with the usual leak jolt, next to the life-loss feedback.
- **Waves:** the Hauler enters the mix from wave 9 — one Hauler on waves 9, 13, 17, 21, … (one every 4 waves), added to the wave's existing spawns and walking in with the wave's normal groups; no wave is made of only Haulers. When the wave preview (T0015) shows the next wave's enemies, the Hauler appears in it by shape and count, like any other enemy.
- Otherwise plain: it does not dash, split, heal, jam or speed up — it just walks, is tough, and is worth more dead than alive.

## Acceptance criteria
- [ ] A new "Hauler" enemy exists (a big round token, distinct from the other six enemy shapes) and walks the road at Block's speed.
- [ ] From wave 9, waves 9, 13, 17, … each include exactly one Hauler in addition to the wave's usual enemies.
- [ ] The Hauler has 3× Block's hp, and killing it pays 10 gold in the gold pop.
- [ ] A leaking Hauler costs 1 life and 5 gold (gold floors at 0), with a red "−5" pop at the exit alongside the usual leak feedback.
- [ ] The existing enemies, the wave preview's layout, sounds and the HUD are otherwise unchanged; works at 412x915 and 1280x720.

## Architect could not design it (cachyos-x8664)

no "STATUS: READY" line after 2 attempt(s). Last output:

```
hat creates/changes a file is denied ("asks before a shell command creates, changes or removes files there").
- I do not have a dedicated `Write`/`Edit` tool in my available set (only `Bash`, `Glob`, `Grep`, `Read`, plus the Chrome MCP tools).

So I cannot create `src/content/enemies/hauler.ts` or apply any of the edits to `types.ts`, `index.ts`, `waves.ts`, `run.ts`, `EnemySystem.ts`, or the tests.

I have the complete, verified plan for all seven changes (from the summary), but I'm blocked from writing them. Can you:

1. Enable file writes (e.g., grant approval for shell file-mutation commands, or make a `Write`/`Edit` tool available), **or**
2. Confirm I should proceed and I'll use whatever write path becomes available — in which case, tell me which tool to call.

Once I can write, I'll apply, in order:

1. `content/types.ts` — add `leakGold?: number` to `EnemyDef`.
2. `content/enemies/hauler.ts` — new file with the Hauler `EnemyDef`.
3. `content/enemies/index.ts` — import + register `hauler`.
4. `core/waves.ts` — add `haulCount()` and the Hauler reservation in `planWave`; exclude `leakGold`-bearing defs from the walkers pool.
5. `core/run.ts` — `RunState.leak(livesCost, leakGold)` subtracting gold (floored at 0).
6. `systems/EnemySystem.ts` — pass `e.def.leakGold` and add the red gold pop next to the life pop.
7. `tests/core/waves.test.ts` — `haulCount` + reservation tests; `tests/content.test.ts` — a `leakGold` sanity check.

Then run `npm run check` and `npm run smoke`.
```
