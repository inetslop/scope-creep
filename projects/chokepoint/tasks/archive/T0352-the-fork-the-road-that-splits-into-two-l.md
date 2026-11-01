---
id: T0352
title: "The fork: the road that splits into two lanes"
assignee: asus
size: L
priority: 2
status: done
depends_on: [T0350]
attempts: 1
created: 2026-11-01T10:31:35Z
claimed_at: 2026-11-01T11:56:03Z
finished_at: 2026-11-01T16:09:15Z
epic: E13
---

## Goal
On some boards the road splits into two lanes and rejoins, and each enemy takes either — a build that covered one side of the road stops covering half the traffic, and the cells between the lanes become the board's best cover.

## Details
- **Which boards.** Some boards, one fork — the same seeded "some boards" trait rule the far gate (T0338) uses; a board may carry both the far gate and the fork. Whatever the far gate's introduction did for shared, saved and ghost boards applies to the fork the same way (same trait mechanism, no new save format). If a board's layout cannot make the fork's stretch, that seed's board simply has no fork.
- **What the player sees.** A way down the road the white road splits into two parallel lanes that rejoin before the exit. The lanes run parallel for the whole stretch (no bend inside the fork), spaced so a full row of build cells sits between them, and the stretch is at least 4 cells long. On a board without the far gate the split is at ~35% of the road's length and the rejoin at ~75–80%; on a board with the far gate the split is a short way (at least 2 cells) past the far gate's entrance, so its enemies reach the split walking the main road. The lanes are equal length: an enemy walks the same distance either one, so wave pacing and the "The long way" node are unaffected. Nothing is painted — the fork is the road's own shape, and the board preview in the daily pick shows the same shape.
- **The rule.** Each enemy, the moment it reaches the split, takes either lane — a coin flip on the run's seeded RNG, so a resumed wave replays the same lanes. The fork is seen as it happens (the enemy visibly turns into its lane); no telegraph. Speed, hp, gold and every other enemy rule are unchanged, and after the rejoin the road is as before. Bosses and their escorts take a lane like any enemy — a Titan and its Guard may end up in different lanes.
- **The cells between the lanes.** The generator guarantees the full row of build cells between the lanes on the fork's stretch (at least 4 cells). A tower on them stands one cell from each lane: double-cover ground in the spirit of the guaranteed choke cell (T0217), but a whole stretch of it, readable from the road's shape — no mark on the cell, no tech. The guaranteed choke and the switchback (T0310) are untouched: the choke is placed as today, in the single-road part of the road.
- **The far gate's share.** Unchanged: on a fork board with the far gate, its third of every non-boss wave still comes in through it, and those enemies take a lane at the split like the rest.
- **The name.** The fork is a named board trait in the same data the far gate lives in: name "The fork", the dry line "the road splits into two lanes and rejoins", source "some boards" — the row the boards reference (T0350) adds from that data.

## Acceptance criteria
- [ ] A seed with the fork trait generates a board whose road splits into two equal parallel lanes and rejoins before the exit; a seed without it generates the same board as before this change.
- [ ] In a wave, every enemy at the split takes one lane (50/50 on the run's seeded RNG) and visibly turns into it; a resumed wave replays the same lanes; every enemy reaches the exit having walked the same distance on either lane.
- [ ] A fork board has at least 4 build cells in the row between the lanes, and a tower built on one of them is in range of both lanes (its placement ring covers both).
- [ ] On a fork board with the far gate, the far gate's entrance is before the split and its enemies take a lane at the split; its share of the wave is unchanged.
- [ ] The board preview shows the fork's shape, and the board trait data carries the fork's name, dry line and "some boards" source for the boards reference's row.
- [ ] A full run on a fork board plays to game over and pays out like any other run (smoke test).

## Design (architect, desktop)

### Files
- create `src/core/fork.ts` — `Fork` type, `forkLane()` (the per-spawn lane coin), `placeFork()` (placement + kinds rebuild, no rng)
- create `tests/core/fork.test.ts` — placement shape, rate, equal lanes, `forkLane`
- edit `src/core/map.ts` — `GameMap.fork?: Fork`; `generateMap` tail: keep the far-gate draw exactly as today, then `const fork = fold ? undefined : (rng.chance(1/3) ? placeFork({ ...result, farGate }) : undefined)` and return `{ ...result, farGate, fork }` (the fork roll is after the far-gate roll, so no-fork seeds stay byte-identical; switchback boards never fork); `cellsBesidePath` walks `[...map.path, ...(map.fork?.laneB ?? [])]`
- edit `src/core/path.ts` — `pathLineForLane(map, cellSize, lane)`: lane 0 is `pathLineFor`; lane 1 splices `map.fork.laneB` between `path[split]` and `path[rejoin]`, same before/after cells
- edit `src/entities/Enemy.ts` — field `lane: 0 | 1 = 0` (reset in `spawn()`), `spawn()` gains trailing `lane: 0 | 1 = 0`
- edit `src/systems/EnemySystem.ts` — `readonly routes: [PathLine, PathLine]` (lane 1 via `pathLineForLane` only when `board.map.fork`, else same line); `spawn(..., lane = 0)` passes `this.routes[lane]!` and the lane; `update()` advances `e.advance(dt, this.routes[e.lane]!)`; getter `routeForLane(lane)`
- edit `src/systems/WaveSystem.ts` — constructor param `hasFork = false`; spawn passes `this.hasFork ? forkLane(this.run.seed, this.run.wave, this.next) : 0`
- edit `src/scenes/GameScene.ts` — one line: `new WaveSystem(this.run, this.enemies, farGateDistance(map), map.fork !== undefined)`
- edit `src/systems/enemyHooks/split.ts` — pass `enemy.lane` to both children; `midSplit.ts` — capture `lane = e.lane` in the pre-`despawn()` capture line, pass it; `leakEcho.ts` — ghost walks `enemies.routeForLane(enemy.lane)`
- edit `src/art/board.ts` — `drawBoard`: when `map.fork`, stroke a second road polyline `[center(path[split]), ...laneB centers, center(path[rejoin])]` in the same style (width `CELL*0.58`, `PALETTE.road`, `setShadow(ctx, 0.7)`)
- edit `src/debug/runChecks.ts` — `board.fork` invariant after `board.fold`: no fork → no active enemy with `lane !== 0`; fork → `laneB.length === rejoin - split - 1` and every `laneB` cell is `'path'`
- edit `src/core/boardFacts.ts` (T0350's board-facts data) — one row next to the far gate's, same shape: name `'The fork'`, line `'the road splits into two lanes and rejoins'`, source `'some boards'`, present when `map.fork`
### Interfaces
```ts
// core/fork.ts
export interface Fork { split: number; rejoin: number; laneB: Cell[] } // split/rejoin: path indices; laneB: lane-2 cells between them, neither end
export function forkLane(seed: number, wave: number, index: number): 0 | 1
export function placeFork(map: GameMap): Fork | undefined
// GameMap: fork?: Fork  ·  pathLineForLane(map: GameMap, cellSize: number, lane: 0 | 1): PathLine
```
### Steps
1. `forkLane`: FNV-1a 31-bit hash of `` `${seed}:${wave}:${index}` `` (same pattern as `dailySeeds` in `core/daily.ts`), return `(h >>> 0) & 1 ? 1 : 0`. Pure — never draws on `run.rng` (see Pitfalls).
2. `placeFork`: work in along/across space with `A/B/cell` helpers (copy the idiom from `core/switchback.ts`). Scan split candidates `iP` outward from `Math.round(0.35 * n)` (far-gate's `[target-d, target+d]` pattern, `iP` in `[2, n-6]`). Accept `iP` only when `path[iP]` starts a run (`A(path[iP-1]) === A(P)` and `B(path[iP-1]) !== B(P)`). For `dir` in `[1, -1]`: skip if `B(path[iP-1]) === b + dir` (lane B would step back into the entry cell) or `b + 2*dir` out of range; scan `iR` from `iP+1` to `n-2`: `R = path[iR]` must have `B(R) === b + 2*dir` and `a1 - a0 >= 5` (parallel stretch and buildable row are both `a1-a0-1 >= 4`); let `span = a1 - a0 + 2`, `newN = n - (iR - iP) + span`; accept the first with `iP/newN` in [0.30, 0.42] and `(iP + span)/newN` in [0.72, 0.82] (phase 1 relaxes to [0.28, 0.45] / [0.70, 0.85]), and `iP >= gate + 2` when `map.farGate` is at index `gate`. New path = `path.slice(0, iP+1)` + lane A `[(a0+1..a1, b), (a1, b+dir), (a1, b+2*dir)]` + `path.slice(iR+1)`; `laneB = [(a0, b+dir), (a0..a1-1 at b+2*dir)]`. Defensive check: newPath and laneB connected, in range, no duplicate cell, exit edge. Kinds (copy switchback's block): old middle cells not in the new path → `'open'`; move rocks found on newPath ∪ laneB ∪ strip `(a0+1..a1-1 at b+dir)` to the first open cell outside all of them (drop if none); newPath and laneB → `'path'`. Return `{ split: iP, rejoin: iP + span, laneB }`, else `undefined`.
3. Wire per Files (Enemy → EnemySystem → WaveSystem → GameScene → hooks → art → invariant → data row), in that order.
4. Tests, then `npm run check`.
### Pitfalls
- **Never draw the lane on `run.rng`.** A resumed wave is replanned from the post-map rng state, so sequential draws would shift every later seeded roll and not replay the same lanes; `forkLane`'s (seed, wave, index) hash is what makes a resumed wave replay the same lanes.
- **Roll order**: the fork roll must stay after the far-gate roll; moving it (or making it consume draws when the fork is skipped… it doesn't — placement is rng-free) would change existing seeds' far gates. A seed without the fork must generate the exact board of today.
- **Equal length**: lane walk P→R is `laneB.length + 1` steps; the main walk is `rejoin - split`. Off-by-one here breaks "same distance either lane" and the invariant.
- Pooled `Enemy`: `lane` reset in `spawn()`; in `midSplit` capture `e.lane` before `e.despawn()` (the slot may be recycled).
- `laneB` cells are road (`'path'`): a rock on one must be relocated, and rocks must never be relocated onto laneB/strip cells.
- Vertical boards: only through the `A/B/cell` helpers; the far-gate token, gates and exit anchor all live on the shared prefix/tail and stay untouched.
- The fork shortens the road (the old middle becomes buildable); wave pacing is unchanged only because both lanes are equal length — keep them so.
### Tests
- `tests/core/fork.test.ts`: over 400 seeds at 14x8 and 8x14 — fork on a minority of boards (>= 15, < 200) and some without; when forking: `laneB.length === rejoin - split - 1`, new path connected/duplicate-free/exit edge, split fraction in [0.28, 0.45] and rejoin in [0.70, 0.85], both straight runs parallel two lanes apart with `a1-a0-1 >= 4`, the whole between-row `'open'`, far gate (when both) at index <= `split - 2`; `generateMap(..., fold=true)` never forks; `forkLane` deterministic, ~50/50 over 200 spawns, differs by seed; `pathLineForLane` routes equal length and point-for-point identical before the split and after the rejoin.

## Result (attempt 1, asus)

Some boards (~1 in 3) now grow "The fork": the road splits into two equal straight lanes that rejoin before the exit, with a full buildable row of at least four cells between them, and each enemy takes a lane by a hash of (seed, wave, spawn index) that never touches the run's rng, so resumed waves replay the same lanes. The roll is the board's last draw, after the far gate's, and placement is rng-free, so boards without the fork are byte-identical to today, switchback boards never fork, and the far gate always sits before the split with its one-third of spawns unchanged. Enemies walk per-lane routes of identical length (so wave pacing, the exit warning and "The long way" are unaffected), split children inherit their parent's lane, and the leak-echo ghost walks back the lane the leaker took; the second lane is painted as the road's own stroke so it shows in the run and the pick preview, and the board reference gains its "The fork" row plus a board.fork invariant. One minimal deviation from the design: placeFork must return the amended GameMap (road and cells change, not just a Fork record), and a one-line mark case was added to boardFactMarks.ts so the reference row paints.

- Self-review: NO VERDICT
- Time: 253.2 min
- Deleted tests/core/zz_pin_scratch.test.ts, as the agent asked.
- Deleted tests/core/zz_choke_scratch.test.ts, as the agent asked.
- Self-review edits were discarded (checks failed at "check").

```
projects/chokepoint/game/src/art/board.ts          |   9 ++
 projects/chokepoint/game/src/core/boardFacts.ts    |   3 +-
 projects/chokepoint/game/src/core/fork.ts          | 155 +++++++++++++++++++++
 projects/chokepoint/game/src/core/map.ts           |  12 +-
 projects/chokepoint/game/src/core/path.ts          |  12 +-
 projects/chokepoint/game/src/debug/runChecks.ts    |   7 +
 projects/chokepoint/game/src/entities/Enemy.ts     |   5 +-
 projects/chokepoint/game/src/scenes/GameScene.ts   |   2 +-
 .../chokepoint/game/src/systems/EnemySystem.ts     |  17 ++-
 projects/chokepoint/game/src/systems/WaveSystem.ts |   9 +-
 .../game/src/systems/enemyHooks/leakEcho.ts        |   4 +-
 .../game/src/systems/enemyHooks/midSplit.ts        |   4 +-
 .../game/src/systems/enemyHooks/split.ts           |   2 +-
 projects/chokepoint/game/src/ui/boardFactMarks.ts  |   6 +
 .../chokepoint/game/tests/core/boardFacts.test.ts  |   5 +-
 .../chokepoint/game/tests/core/farGate.test.ts     |  16 ++-
 projects/chokepoint/game/tests/core/fork.test.ts   | 154 ++++++++++++++++++++
 projects/chokepoint/game/tests/core/map.test.ts    |  52 ++++---
 .../game/tests/core/temp_bend_sweep.test.ts        |  10 +-
 19 files changed, 440 insertions(+), 44 deletions(-)
```
