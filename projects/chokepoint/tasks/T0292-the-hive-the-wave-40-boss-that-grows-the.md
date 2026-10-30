---
id: T0292
title: "The Hive: the wave-40 boss that grows the group"
size: L
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-30T17:15:59Z
---

## Goal
The run's next peak past the Orb: wave 40 sends a boss that answers a single-target build the way the Colossus's phase does — but with pressure instead of a pause. The Hive keeps popping Dots while it walks, so the board never goes quiet.

## Details
- **The every-10 rule's fourth boss:** wave 40 sends exactly one Hive and nothing else — the plan's whole budget in one shape (the Orb's pattern) — declared as the wave's boss, so the arrival horn (T0268), the boss card (T0256), the death burst and name card (T0273) and the escape note (T0269) all fire for it with no new HUD.
- **Numbers:** behavior walk; hp 720 base (the boss base, wave-scaled like the Orb's); speed 0.9 (Block's speed, the boss norm); gold 20; livesCost 1 (a boss leak costs one life, as always); threat: the wave-40 plan's whole budget (the Orb's 150-at-30 pattern); fromWave 40; spawnOnly — never in a wave's mix, and not counted in the 10-regular cap (the Feeder, T0289, fills it).
- **The pop (the new mechanic):** while the Hive is alive, every 6.0 s it pops one small Dot at its spot — the Dot's own wave-scaled numbers, an ordinary enemy in every way (its gold, the combo, Mint and the "stopped" tally all count) — up to 5 pops per Hive, the first at 6.0 s after its own spawn, and the popping stops the instant it dies. Each pop is telegraphed: 0.8 s before it, one thin purple ring blooms once at the Hive's base (the working-aura ring, T0055, in the Hive's own color), then the Dot pops in with the ordinary spawn pop plus a small ring at its spot.
- **A popped Dot is a real spawn:** it takes the run's Tough the same way a plan spawn does (T0285's hp factor), and it is subject to everything (slow, root, push, silence) like any Dot.
- **The count:** the next-wave button's enemies-left count includes the popped Dots (alive or not yet popped), so it never dips below zero and reaches zero only when the board is truly clear.
- **Look:** a purple pentagon at size 0.5 — the boss scale, a new silhouette in the closed warm family (the pentagon is no enemy's shape: the Orb is a hexagon, the Titan a square, the Mute a ring).
- **What it punishes and what answers it:** a pure single-target build — focus the Hive and the Dots leak, focus the Dots and the Hive walks. The area line answers it: Splash, a Trap's blast, Ember (the burn ticks and jumps on death), the beam's Lance corridor, and Spray up close all clear a fresh Dot in one hit, and a Push gust shoves a just-popped Dot back.
- **The reference:** the wave preview shows the Hive's token ×1; the name tag says "Hive" on its first spawn (T0085); the bosses reference grows its row from the def (T0277), teach language: "pops a Dot every 6 s — area kills answer it."

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | `walk`, the basic walker | the Hive pops Dots onto the board while it lives; a Dot only walks |
| Block | `walk`, slow and tough | the Hive acts on the group; a Block only takes damage |
| Colossus | `walk`, the whole wave in one boss shape | the Colossus leaves the fight on a clock (the out-of-reach beat); the Hive never does — it grows the group instead |
| Guard | `walk`, a boss escort | the Guard shields one other shape the wave sends; the Hive makes its own reinforcements |
| Titan | `walk`, a boss whose damage turns on another enemy | the Titan's state follows the Guard's life; the Hive's output follows its own clock and stops only when it dies |
| Orb | `walk`, a boss that makes more enemies | the Orb turns itself into two Shards once, at half hp; the Hive stays whole and pops repeatedly while it lives |
| Shard | `walk`, a piece of a split | a Shard is what a split leaves behind; it never produces |
| Sprinter | `walk`, a shape that changes under fire | the Sprinter speeds itself up when hit; the Hive changes the board, not itself |
| Splitter | `walk`, a death that makes more enemies | the Splitter's split is its death, once, into two of another kind; the Hive's pops are periodic, while it lives, and it keeps walking |
| Hauler | `walk`, big and slow | the Hauler carries a fortune on a leak; it never adds to the group |
| Mute | `walk`, works on towers instead of enemies | the Mute stills towers; the Hive feeds enemies |
| Ward | `walk`, a self-defense | the Ward only defends itself |
| Bulwark | `walk`, a plate that faces the road | the Bulwark halves hits aimed at it; it never adds enemies |
| Splinter | `walk`, a fast piece | a piece, not a producer |

## Acceptance criteria
- [ ] Wave 40's plan is exactly one Hive (the whole budget, the "boss" tag); every other wave plan is unchanged.
- [ ] A live Hive pops one Dot at its spot at 6.0 s, 12.0 s, …, up to five Dots; the pops stop the moment it dies; each pop wears the 0.8 s telegraph ring and the ordinary spawn pop.
- [ ] The popped Dots are ordinary enemies: they pay their own gold, feed the combo and Mint, take Tough like a plan spawn, and the wave ends only when the Hive and every popped Dot are dead or leaked.
- [ ] The next-wave button's enemies-left count includes the popped Dots and never dips below zero.
- [ ] The arrival horn, the boss card, the death burst and name card, and the escape note all fire for the Hive from the existing boss hooks; the bosses reference lists it in wave order.
- [ ] Unit tests pin the pop schedule (6 s apart, first at 6 s, five max) and the wave-40 plan; npm run check and the desktop 1280×720 / mobile 412×915 smoke pass.

## Design (architect, inet-racing)

### Files
- create `src/content/enemies/hive.ts` — the Hive `EnemyDef` (copy of `orb.ts` with the `pops` field).
- edit `src/content/enemies/index.ts` — one `hive` line in `ENEMIES`, next to `orb`.
- edit `src/content/types.ts` — one new optional field on `EnemyDef` (after `splitsAt`, line 35).
- create `src/core/hivePops.ts` — pure pop-schedule math (`popsDue`, `nextPopAt`).
- create `src/systems/enemyHooks/hivePops.ts` — the hook: per-hive clock, telegraph ring, spawns the Dots.
- edit `src/systems/enemyHooks/index.ts` — import + one `hivePops` entry next to `midSplit`.
- edit `src/core/waves.ts` — `bossId(40)` returns `'hive'` (+ comments on the boss waves).
- edit `src/core/run.ts` — new `RunState.pendingPops` field next to `leaksThisWave`.
- edit `src/systems/RunFlow.ts` — `enemiesLeft` adds `run.pendingPops`.
- edit `src/debug/runChecks.ts` — two invariant lines next to `enemies.orb`.
- create `tests/core/hivePops.test.ts` — pins the schedule.
- edit `tests/content.test.ts` — size cap + `pops` validation.
- edit `tests/core/waves.test.ts` — wave-40 assertions become the Hive.

### Interfaces
- `EnemyDef.pops?: { everySec: number; max: number; telegraphSec: number; into: string }` — the periodic pop (Hive): every `everySec` after its own spawn, up to `max`, each telegraphed `telegraphSec` early; `into` is the child enemy id.
- `core/hivePops.ts`: `popsDue(clockSec: number, rule: NonNullable<EnemyDef['pops']>): number` (how many popped by that time, capped) and `nextPopAt(clockSec: number, rule: ...): number` (seconds until next pop, -1 when done).
- `RunState.pendingPops: number` — Dots a live Hive will still pop; the hook writes it every wave frame, `RunFlow.enemiesLeft` reads it.
- Hook uses existing ctx: `enemies.spawn(def, waveHpMul(run.wave) * run.levelHpMul, e.distance)` (same scaling as a plan spawn), `fx.ring(x, y, radius, color)`, `auraRing(fx, x, y, color)` (T0055 ring).

### Steps
1. `hive.ts` def: `id 'hive'`, `behavior 'walk'`, `hp 720`, `speed 0.9`, `gold 20`, `livesCost 1`, `threat 200`, `fromWave 40`, `spawnOnly: true`, `pops { everySec: 6, max: 5, telegraphSec: 0.8, into: 'dot' }`, `look { shape: 'pentagon', color: 'purple', size: 0.5 }`; description "The whole wave in one shape: it pops a Dot every 6 s while it walks — area kills answer it." Register it; the token, name tag, wave preview (×1), BossesScene row and all boss hooks follow from the def + `bossId`.
2. `types.ts` field with a doc comment mirroring `splitsAt`'s.
3. `core/hivePops.ts` + its test (pure: `popsDue = min(max, floor(clock/everySec))`, clamped at 0; `nextPopAt = (done+1)*everySec` or -1).
4. `enemyHooks/hivePops.ts`: closure `Map<Enemy, {serial, clock, pops, telegraphed}>` (reset on serial change — the pool reuses objects; prune inactive each frame). Per active enemy with `def.pops`: `clock += dt`; bloom `auraRing` once when `clock >= nextPopAt - telegraphSec` and not yet telegraphed; `while (pops < popsDue(clock))` spawn the Dot at the hive's distance (capture `x, y, distance` before the loop) with the hp mul above, plus a small `fx.ring` in the Dot's color at that spot; reset `telegraphed` on each pop; sum `max - pops` into `run.pendingPops` (0 when no hive is alive). Register next to `midSplit`.
5. `waves.ts`: `bossId` gains `wave === 40 ? 'hive'` before the existing branches; the generic boss-plan branch emits it unchanged (boss tag, `waveHpMul(40)`, horn, card, burst, escape note all fire with no other change).
6. `run.ts`: `pendingPops = 0;` with a comment. `RunFlow.ts`: `enemiesLeft` returns `waves.remaining + enemies.aliveCount + run.pendingPops`.
7. `runChecks.ts` next to `enemies.orb`: `['enemies.hive', ≤ 1 active hive]` and `['hive.pending', pendingPops integer in 0..5]`.
8. Test edits (see Tests).

### Pitfalls
- `threat` must be exactly `waveBudget(40)` = 200 or the BossesScene row (auto-discovery) and the "whole budget in one shape" premise break.
- `tests/content.test.ts:27` caps non-titan/orb sizes at 0.45 — add `'hive'` to the 0.5 allowance or `npm run check` fails.
- `tests/core/waves.test.ts` hard-asserts wave 40 = Colossus (lines 148, 159, 172) — update all three, don't leave a red suite.
- The boss branch draws the normal plan first for rng stability — keep it; only `bossId` changes, so seeded plans for 10/20/30 stay identical.
- Popped Dots take Tough via `run.levelHpMul` exactly like plan spawns; keep the two in sync if the formula changes.
- Count can't dip or lie: `pendingPops` is rewritten every wave frame and the hook stops counting the dead hive, so the total hits zero exactly when the board is clear.

### Tests
- `tests/core/hivePops.test.ts`: rule `{everySec: 6, max: 5, telegraphSec: 0.8}` — `popsDue` 0 at 0 and 5.99, 1 at 6, 2 at 12, 4 at 29.99, 5 at 30 and 1e6; `nextPopAt` 6 at 0, 12 at 6, 30 at 24, -1 at 30.
- `waves.test.ts`: `bossId(40)` is `'hive'`; wave-40 plan `[{ enemy: 'hive', delaySec: 0 }]` with the boss tag and `waveHpMul(40)`; same plan on every rng stream; no wave but 40 sends a Hive; fix line 172's comment.
- `content.test.ts`: line 27 gains `|| e.id === 'hive'`; a `pops` block mirrors `splitsAt`'s (`everySec > 0`, `max > 0`, `0 < telegraphSec < everySec`, `into` exists in `ENEMIES`).
- `npm run check` and `npm run smoke` (1280×720 + 412×915) pass.
