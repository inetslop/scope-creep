---
id: T0057
title: "Hauler: the enemy whose leak costs gold"
assignee: cachyos-x8664
size: M
priority: 2
status: in-progress
depends_on: [T0046]
attempts: 1
created: 2026-10-28T13:04:03Z
claimed_at: 2026-10-28T20:40:19Z
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

## Note (by hand, 2026-10-28)

No longer waits on T0053, T0071: that only kept the tasks from editing the same files at once, and the runner now does that itself (a task can't start while another task that edits one of its files is being built). Where this task's text says another task lands first, it may land before or after: build against the code as it is when you start.

## Design reset (by hand, 2026-10-28)

The old design edited shared hub files that the game now has extension points for (CLAUDE.md recipes: enemy hooks in `systems/enemyHooks/`, effects in `systems/fx/`). Design it so it edits as few shared files as possible: a task that only adds its own files and registry lines can be built while other tasks run; one that edits a shared file waits until nobody else is editing it. The gold a leak costs is an enemy hook (`onLeak`, the enemy is still at its spot; the hook runs just before the lives are taken) with its red pop; no `EnemySystem.leak()` or `FxSystem` edit. The content, wave and run-state parts stay.

## Design (architect, cachyos-x8664)

### Files
- create `src/content/enemies/hauler.ts` — the Hauler's `EnemyDef` (copy `block.ts`'s shape)
- edit `src/content/enemies/index.ts` — `hauler` import (alphabetical, between `dot` and `splinter`) + one line in `ENEMIES` after `splitter` (next to the other fromWave-9 entry)
- create `src/systems/enemyHooks/haulerLeak.ts` — the Hauler's leak: −5 gold (floor 0) + the red "−5" pop next to the life pop
- edit `src/systems/enemyHooks/index.ts` — one line: `haulerLeak` in `ENEMY_HOOKS`, next to `split`
- edit `src/core/waves.ts` — keep the Hauler out of the budget picks + reserve one on 9, 13, 17, …
- edit `tests/core/waves.test.ts` — exclude the Hauler from the budget test's `spent` + the new schedule test

### Interfaces
No new types or signatures (`planWave`, `EnemyDef`, `MakeEnemyHook` all unchanged). Exact added values:
```ts
// src/content/enemies/hauler.ts
export const hauler: EnemyDef = {
  id: 'hauler',
  name: 'Hauler',
  description: 'Big and slow, and it hauls a small fortune: 10 gold for the kill, a life and 5 gold if it gets through.',
  behavior: 'walk',
  hp: 360, // 3× Block's 120
  speed: 0.9, // Block's speed
  gold: 10,
  livesCost: 1,
  threat: 1, // placeholder: the Hauler never gets drawn from the budget
  fromWave: 9,
  look: { shape: 'hexagon', color: 'red', size: 0.34 }, // 1.3× Block's 0.26; round, no enemy shape has it
};
```
```ts
// src/systems/enemyHooks/haulerLeak.ts
export const haulerLeak: MakeEnemyHook = ({ run, fx }) => ({
  onLeak(enemy) {
    if (enemy.def.id !== 'hauler') return;
    run.gold = Math.max(0, run.gold - 5);
    fx.popText(enemy.x + 40, enemy.y - 20, '-5', PALETTE.red);
  },
});
```
```ts
// the two lines in planWave (src/core/waves.ts)
// walkers filter (line 62): append the last clause
const walkers = unlocked.filter((e) => e.speedRamp === undefined && e.dashCycle === undefined && e.splitsInto === undefined && e.id !== 'hauler');
// after the splitter block, before the `reserved.length === 0` early return:
if (wave >= 9 && (wave - 9) % 4 === 0) reserved.push('hauler');
```
Color: Dasher (T0046, landed) has purple, so per the task's condition the Hauler takes the next warm — red over orange (the darker of the two); the acceptance is shape-based anyway.

### Steps
1. Create the def (exact values above; texture is painted automatically).
2. One import line + one `ENEMIES` line in `content/enemies/index.ts`.
3. The two lines in `waves.ts`.
4. Create the hook, add one line to `ENEMY_HOOKS` (the guard on `def.id` keeps the other seven no-ops).
5. The test in `tests/core/waves.test.ts`.
6. `npm run check` (typecheck + lint + unit, incl. content and waves tests).

### Pitfalls
- The walkers exclusion is mandatory: without it the Hauler is a normal budget pick and gets drawn 0–3 times on 9+ waves, breaking "exactly one".
- `threat` must stay > 0 (`tests/content.test.ts`), but it's unused: the exclusion keeps it out of every `threat` read, so the number is a placeholder.
- The reservation is free (like the splitter's): it does not touch `budget`, and the budget test's `spent` must skip `s.enemy === 'hauler'` too or it fails on every scheduled wave (spent = budget + 1).
- The push sits after the splitter block and before the `reserved.length === 0` early return; on 9+ `reserved` is never empty, but the spot keeps the schedule next to the splitter's.
- `onLeak` runs while the enemy is still active at the exit, just before `run.leak()` takes the life — so the pop's spot is valid and the gold lands before the lives; the hook mutates the public `run.gold` field directly (no `RunState` edit).
- The "−5" pop is offset +40 in x (≤ 1 cell, `CELL` is 64), same y as the "−1" life pop: `fx.popText` exists, no `FxSystem` method, no new `fx/` file, no `EnemySystem` edit (life, jolt and `sfx.leak` stay the usual leak).
- Kill gold needs no code: `gold: 10` rides the existing `kill()` pop; Mark bonus damage and every other hit already go through the generic hit path (no def flag).

### Tests
- `tests/core/waves.test.ts`: for waves 1–30, `plan.spawns.filter((s) => s.enemy === 'hauler').length` is 1 on 9, 13, 17, 21, 25, 29 and 0 otherwise; on scheduled waves the plan has other spawns (never a Hauler-only wave).
- The budget test keeps passing with the `spent` exclusion (walkers still drain to ≥ 1, so usual enemies stay on every wave).
- `npm run check`: content test validates the def (warm color, size ≤ 0.45, threat > 0, fromWave ≥ 1); wave preview and textures pick the Hauler up by construction.
- Smoke at 412x915 and 1280x720: the leak jolt + red "−5" pop at the exit, Hauler icon in the wave preview from wave 9.
