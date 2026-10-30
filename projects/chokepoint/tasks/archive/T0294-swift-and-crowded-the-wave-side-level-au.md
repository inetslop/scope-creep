---
id: T0294
title: "Swift and Crowded: the wave-side level augments"
assignee: asus
size: M
priority: 1
status: done
depends_on: []
attempts: 1
created: 2026-10-30T17:33:38Z
claimed_at: 2026-10-30T18:02:55Z
finished_at: 2026-10-30T20:28:20Z
epic: E9
---

## Goal
The level picker (T0285) grows from one rule to three: two more level augments that change what a wave sends, so the long-term ladder (E9) has its first real choices to pick between.

## Details
- Two new level augments, each its own content file beside `src/content/levels/tough.ts` in the same shape (name, plain line, its number, its multiplier bonus):
  - **Swift** — card line "enemies walk 15% faster". Every enemy that spawns in the run walks at 1.15× its normal speed: one speed factor applied where Tough's hp factor already applies (T0285), so every spawn takes it — regulars, the reserved big ones, the bosses and their spawns (the Guard, the Hive's popped Dots). The per-wave hp growth is untouched. Bonus: +15%.
  - **Crowded** — card line "waves send 20% more enemies". The wave plan's enemy count ×1.2, rounded to the nearest integer (half up), applied to the final plan the wave would otherwise send (after the quiet halving); a boss wave keeps its own plan (wave 10 the Colossus alone, wave 20 the Titan and its Guard, wave 30 the Orb). The next-wave preview shows the inflated counts because it reads the plan. Bonus: +20%.
- Same wiring as Tough: the picker gains a row for each (capped at the slot count, saved in the profile, preselected for the next run), the run save carries the selection so a resumed run keeps its rules, and the menu's multiplier readout recomputes as 1 + the sum of the selected augments' bonuses (the same way it reads Tough's +25%): ×1.15 Swift alone, ×1.20 Crowded alone, ×1.35 both, ×1.60 Tough + both. The picker card grows to fit the whole set (the menu's fit-sum pattern), at 412x915 and 1280x720.
- The rules are pure, with unit tests beside T0285's `tests/core/levels.test.ts`: the count table (a 5-enemy wave → 6, a 10-enemy wave → 12, a boss wave keeps its plan, a quiet wave's final plan inflated), the spawn speed factor (1.15 on a regular and on a boss's spawn), and the bonus summing.

## Acceptance criteria
- [ ] The menu picker lists Swift and Crowded under Tough, each with its number, toggled on and off up to the slot count; the multiplier line reads ×1.15 / ×1.20 / ×1.35 for Swift / Crowded / both, and ×1.60 with Tough + both.
- [ ] In a Swift run, every spawned enemy walks at 1.15× the speed the same wave sends without Swift (asserted on a spawn in a test, including a boss's spawn); without Swift the speed is byte-identical to today.
- [ ] In a Crowded run, the wave preview shows the inflated counts (a 5-enemy wave shows 6, a 10-enemy wave shows 12) and every boss wave still shows its own plan; without Crowded the plans are byte-identical to today.
- [ ] A resumed run keeps its selection: after closing and resuming, spawn speeds and wave counts still carry the factors.
- [ ] With both off, the plans, the spawn speeds and the multiplier line are exactly as today.

## Design (architect, desktop)

### Files
- create `src/content/levels/swift.ts` - Swift level augment data (same shape as `tough.ts`)
- create `src/content/levels/crowded.ts` - Crowded level augment data
- edit `src/content/types.ts` - two optional fields on `LevelAugmentDef`
- edit `src/content/levels/index.ts` - import the two, add them to `LEVEL_AUGMENTS` after `tough`
- edit `src/core/levels.ts` - `levelSpeedMul()`, `levelCountMul()`
- edit `src/core/waves.ts` - `planWithLevel()` (the Crowded rule, pure)
- edit `src/entities/Enemy.ts` - `speedMul` field + `spawn()` parameter
- edit `src/systems/EnemySystem.ts` - `spawn()` parameter
- edit `src/systems/WaveSystem.ts` - apply both factors (plan + spawn)
- edit `src/systems/enemyHooks/split.ts` - pass the parent's speed factor to children
- edit `src/systems/enemyHooks/midSplit.ts` - same (capture before `despawn()`)
- edit `src/debug/runChecks.ts` - two invariant lines after `level.choice`
- edit `tests/core/levels.test.ts` - new tests; update the "one level augment" test
- edit `tests/systems/enemyHooks.test.ts` - fake context records `speedMul`; assert children inherit it

### Interfaces
```ts
// content/types.ts, on LevelAugmentDef (next to `bonus`):
  /** The spawn-speed factor while it is on (Swift: 1.15); absent when it doesn't touch speed. */
  speedMul?: number;
  /** The wave's enemy-count factor while it is on (Crowded: 1.2); absent when it doesn't touch counts. */
  countMul?: number;

// content/levels/swift.ts:
export const swift: LevelAugmentDef = { id: 'swift', name: 'Swift', line: 'enemies walk 15% faster', bonus: 0.15, speedMul: 1.15 };
// content/levels/crowded.ts:
export const crowded: LevelAugmentDef = { id: 'crowded', name: 'Crowded', line: 'waves send 20% more enemies', bonus: 0.2, countMul: 1.2 };
// content/levels/index.ts:  LEVEL_AUGMENTS: readonly LevelAugmentDef[] = [tough, swift, crowded];

// core/levels.ts (after levelMultiplier, before levelMultiplierLabel):
export function levelSpeedMul(ids: readonly string[]): number;   // product of chosen defs' speedMul, 1 if none
export function levelCountMul(ids: readonly string[]): number;   // product of chosen defs' countMul, 1 if none

// core/waves.ts (after planNormalWave, before waveCounts):
export function planWithLevel(plan: WavePlan, mul: number): WavePlan;
//   if (mul === 1 || isBossWave(plan.number)) return plan;   // same object: off runs stay byte-identical
//   const want = Math.floor(plan.spawns.length * mul + 0.5); // count x mul, half up
//   if (want <= plan.spawns.length) return plan;
//   return { ...plan, spawns: [...plan.spawns, ...plan.spawns.slice(0, want - plan.spawns.length)] }; // extras repeat the plan's entries in order

// entities/Enemy.ts: field `speedMul = 1;` after `hpMul` (line 29);
//   spawn(def: EnemyDef, hpMul: number, path: PathLine, speedMul = 1, distance = 0): void;
//   in spawn(): this.speedMul = speedMul; and this.speed = def.speed * CELL * speedMul;
// systems/EnemySystem.ts:
//   spawn(def: EnemyDef, hpMul: number, speedMul = 1, distance = 0): Enemy;  // -> enemy.spawn(def, hpMul, this.board.path, speedMul, distance)
```
RunState needs no new getter: `WaveSystem` calls `levelSpeedMul(this.run.level)` / `levelCountMul(this.run.level)` (do not touch `core/run.ts`).

### Steps
1. `types.ts`: add the two optional fields to `LevelAugmentDef`.
2. Create `swift.ts` and `crowded.ts` exactly as above; register them in `levels/index.ts` (imports with the others, one line each).
3. `core/levels.ts`: add `levelSpeedMul`/`levelCountMul`, each the same loop shape as `levelMultiplier` but multiplying `def?.speedMul` / `def?.countMul` when present.
4. `core/waves.ts`: add `planWithLevel` exactly as sketched (the boss guard uses the existing `isBossWave`).
5. `Enemy.ts` + `EnemySystem.ts`: add the `speedMul` parameter (before `distance`) and field, reset in `spawn()`.
6. `WaveSystem.ts`: import `levelCountMul, levelSpeedMul` from `../core/levels`; in `planNext()` and `start()` wrap the `planWave(...)` call in `planWithLevel(..., levelCountMul(this.run.level))`; in `update()` (line 73) pass `levelSpeedMul(this.run.level)` as the spawn's third argument.
7. `split.ts:10`: `enemies.spawn(child, enemy.hpMul, enemy.speedMul, d);`. `midSplit.ts:22`: add `sm = e.speedMul` to the capture line (line 20) and call `enemies.spawn(child, half / child.hp, sm, dd);`.
8. `runChecks.ts`: after `level.choice` add `['level.speed', (g) => (g.enemies.all.every((e) => !e.active || e.speedMul === levelSpeedMul(g.run.level)) ? null : 'an enemy walks at the wrong level speed factor')]` (import `levelSpeedMul` from `../core/levels`) and `['level.bossPlan', (g) => { if (!bossId(g.run.wave) || !g.waves.currentPlan) return null; const want = g.run.wave === 20 ? 2 : 1; return g.waves.currentPlan.spawns.length === want ? null : `boss wave ${g.run.wave} sends ${g.waves.currentPlan.spawns.length}, not ${want}`; }]` (reuse the existing `bossId` import).
9. Tests (below). Run `npm run check`.

### Pitfalls
- Spawn signature: `speedMul` goes BEFORE `distance`; there are exactly three call sites of `EnemySystem.spawn` (WaveSystem, split, midSplit) and one of `Enemy.spawn` (EnemySystem) — update all, or `distance` silently becomes a speed factor.
- `midSplit` despawns the parent before spawning children and the pool slot can be recycled: capture `e.speedMul` in the existing capture line, never after `e.despawn()`.
- Byte-identical when off: `x * 1 === x` in IEEE-754, and `planWithLevel` must return the same object (not a copy) when `mul === 1` or on a boss wave.
- Rounding: `Math.floor(n * mul + 0.5)` is half-up; `10 * 1.2 === 12.000000000000002` still floors to 12.
- Do NOT scale the Sprinter's `speedRamp` (`perHit`/`max`) or the `enemies.speedCap` invariant: the factor is spawn-only, exactly where Tough's hp factor is; spawn 2.52×1.15 = 2.898 < cap 5.32, so the old invariant holds untouched.
- Do NOT change `levelMultiplierLabel`: Crowded alone renders `×1.2` and all three `×1.6` under T0285's existing trailing-zero rule (the task's `×1.20`/`×1.60` are the same values); the menu readout, picker rows, slot cap, save/restore and profile validation all flow through the existing `LEVEL_AUGMENTS`/`run.level`/`levelOn` plumbing with zero changes.
- Menu fit: `LevelCard`'s height formula already grows with `LEVEL_AUGMENTS.length` and `MenuScene`'s fit-sum already includes `level.height`, so no layout code changes; at 412x915 the existing column-scale branch absorbs the two extra rows (rows stay 52 px ≥ 44 px touch).

### Tests
- `tests/core/levels.test.ts`: update the "Tough is the one level augment" test to `['tough', 'swift', 'crowded']` with bonuses 0.25/0.15/0.2; multiplier/label cases `['swift']`→1.15, `['crowded']`→1.2, `['swift','crowded']`→1.35, `['tough','swift','crowded']`→1.6; `levelSpeedMul` (1 off, 1.15 with swift, 1 with tough+swift, 1 with crowded); count table via `planWithLevel` on synthetic plans (5→6, 10→12, first entries untouched, extras repeat entries in order, `mul === 1` returns the same object, boss plans for waves 10/20/30 returned unchanged) and the quiet final plan: `planWave(4, new Rng(seed), ENEMIES)` (already halved) then `planWithLevel(..., 1.2)` has length `Math.floor(n*1.2+0.5)`.
- `tests/systems/enemyHooks.test.ts`: extend the fake context's `spawn` to record `speedMul`; the splitter test passes `speedMul: 1.15` on the parent and asserts both children were spawned with it (a boss's spawned Dots inherit it the same way).

## Result (attempt 1, asus)

The level picker now offers three pre-run rules — Tough (+25% hp), the new Swift (enemies walk 15% faster, applied as a spawn-speed factor to every enemy including split children, in `Enemy.spawn`/`EnemySystem.spawn`/`WaveSystem`/both split hooks) and the new Crowded (waves send 20% more enemies, via the pure `planWithLevel` in `core/waves.ts` that inflates the final plan half-up and leaves boss plans byte-identical). The picker rows, slot cap, save/restore, multiplier readout (×1.15/×1.2/×1.35/×1.6) and both new invariants all flow through T0285's existing plumbing; when both are off, plans, speeds and the readout are exactly as before. Note: per the design, `core/run.ts` is untouched, so the run multiplier — which since T0285 also acts as the enemy-hp factor — now sums all selected bonuses (a Swift-only run's enemies are therefore also 15% tougher), matching the displayed multiplier. Verified with `npm run check` and `npm run smoke` (desktop + phone).

- Self-review: NO VERDICT
- Time: 145.4 min
- Self-review edits were discarded (checks failed at "check").

```
.../chokepoint/game/src/content/levels/crowded.ts  | 10 ++++
 .../chokepoint/game/src/content/levels/index.ts    |  4 +-
 .../chokepoint/game/src/content/levels/swift.ts    | 10 ++++
 projects/chokepoint/game/src/content/types.ts      |  4 ++
 projects/chokepoint/game/src/core/levels.ts        | 20 +++++++
 projects/chokepoint/game/src/core/waves.ts         | 12 +++++
 projects/chokepoint/game/src/debug/runChecks.ts    |  3 ++
 projects/chokepoint/game/src/entities/Enemy.ts     |  7 ++-
 .../chokepoint/game/src/systems/EnemySystem.ts     |  4 +-
 projects/chokepoint/game/src/systems/WaveSystem.ts |  9 ++--
 .../game/src/systems/enemyHooks/midSplit.ts        |  4 +-
 .../game/src/systems/enemyHooks/split.ts           |  2 +-
 projects/chokepoint/game/tests/core/levels.test.ts | 63 +++++++++++++++++++---
 .../game/tests/systems/enemyHooks.test.ts          |  7 +--
 14 files changed, 137 insertions(+), 22 deletions(-)
```
