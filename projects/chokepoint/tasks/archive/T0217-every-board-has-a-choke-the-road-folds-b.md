---
id: T0217
title: "Every board has a choke: the road folds back on itself"
assignee: asus
size: L
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-29T16:16:13Z
claimed_at: 2026-10-29T23:10:47Z
finished_at: 2026-10-30T05:15:58Z
---

## Goal
The game is named for a tower watching two stretches of road at once — today that spot is luck of the seed, and some boards never come close to themselves, so their worth-more bend cells (pillar 1, the T0140 notches) are worth less than the rest. Every new board gets a guaranteed choke.

## Details
- What exists: the generator grows a winding path from entrance to exit (14x8 landscape, 8x14 portrait) with rocks and a bend target (T0208's territory). A cell beside a bend is "worth more" — it covers more road — only when the road passes nearby again, and nothing guarantees it does.
- A **choke cell** is a buildable cell within 1.7 cells (the game's shortest range, Splash's) of the centers of two road cells that are at least 3 path steps apart: from that cell every tower in the game reaches both stretches of road. Every new board has at least one.
- The change: a deterministic geometry pass after the usual generation (no rng draws, so the same seed still gives the same board). If the board already has a choke cell it is untouched — byte-identical to today for that seed. If not, the generator adds a turn or reroutes one stretch of the path until a choke cell exists, keeping the cells between the two stretches buildable (not road, not rock) and the path continuous, non-self-overlapping and inside the board.
- The seed decides where the choke sits, so every run's choke is somewhere else (pillar 2). The T0140 bend notches already mark the choke's cells — no new board art. The pass runs after the usual growth, so it composes with T0208's "One more bend" when both apply.
- Saved boards keep their exact shape: the pass is a change a bare seed cannot encode for old boards, so the run save and the profile's best-seed record carry a small board-generation version — T0208's saved-parameter pattern (its `bends` field does the same job for the extra bend): a board made before this change regenerates without the pass, a board made after it regenerates with its choke, and towers never land on path or rock after a resume or a ghost replay (T0078).
- Balance: every board is at least as strong as today (one guaranteed double-cover cell); the waves, which scale by wave number, are unchanged.

## Acceptance criteria
- [ ] A unit test over at least 50 fresh seeds per orientation (14x8 and 8x14): every generated board has at least one choke cell (a buildable cell within 1.7 of two road cells 3+ path steps apart); every path is still continuous from entrance to exit, uses no cell twice and stays in bounds; the same seed gives the same board.
- [ ] A board whose path already has a choke cell regenerates byte-identical with the new generator (the pass is a no-op), so its old saves and ghost replays are untouched.
- [ ] In play, a tower placed at a choke cell reaches both stretches — its range ring crosses the road twice, even at the shortest range (Splash); the T0140 notches mark the choke's bend cells; the board's look is otherwise unchanged (light island, white road, no new art).
- [ ] A resumed run shows the exact board it had (every tower on a buildable cell); a ghost run of a saved board shows that board's exact shape, with or without a choke.

## Design (architect, desktop)

### Files
- create `src/core/choke.ts` - pure choke logic: `chokeCells()` (detect) and `ensureChoke()` (deterministic no-rng tail fold that guarantees one)
- create `tests/core/choke.test.ts` - the seed sweeps (see Tests)
- edit `src/core/map.ts` - `generateMap` gains a `bgen` param (default 2); returns `bgen >= 2 ? ensureChoke(map) : map`; one line `import { ensureChoke } from './choke'`
- edit `src/core/run.ts` - `RunState` gains `readonly bgen: number`, constructor `constructor(seed: number, bgen: number = 2)`
- edit `src/core/profile.ts` - `Profile` gains `bestSeedBgen: number | null`; `RunResult` gains required `bgen: number`; `loadProfile` heals legacy (missing → 1, invalid → 1 when `bestSeed` is set, else null); `recordRun` stores `result.bgen` with the new best seed
- edit `src/core/saveRun.ts` - `SavedRun` gains required `bgen: number`; `loadSavedRun`: missing `bgen` → 1 (legacy save), present but not `inInt(p.bgen, 1, 8)` → `return undefined`; return object carries `bgen`
- edit `src/systems/RunSave.ts` - `persist()` adds `bgen: run.bgen,` after `seed: run.seed,`
- edit `src/scenes/GameScene.ts` - `ghostSeed` registry value becomes `{ seed, bgen }`; resolve `bgen = saved ? saved.bgen : (ghost ? ghost.bgen : 2)`; pass to `new RunState(seed, bgen)` and to `generateMap(..., ROCKS, this.run.bgen)` (line 87)
- edit `src/scenes/MenuScene.ts` - ghost button: `this.registry.set('ghostSeed', { seed, bgen: p.bestSeedBgen ?? 1 })`
- edit `src/scenes/GameOverScene.ts` - `recordRun` call adds `bgen: run.bgen`
- edit `src/debug/runChecks.ts` - import `chokeCells`; add line after `run.ledger`: `['board.choke', (g) => (g.run.bgen < 2 || chokeCells(g.board.map).length > 0 ? null : 'a gen-2 board has no choke cell')],`
- edit `tests/core/map.test.ts` - "exactly the requested rocks" test: fold may relocate rocks, so assert `rocks <= 5 && rocks >= 4` and no rock on the path
- edit `tests/core/profile.test.ts` - add `bgen: 2` to every `recordRun` call; add `bestSeedBgen` (`null` where `bestSeed` is null, else `2`) to the `toEqual` profile objects (lines ~33, 38, 48, 52, 60)
- edit `tests/core/saveRun.test.ts` - `sample()` gains `bgen: 2`; add: legacy save without `bgen` loads with `bgen: 1`; save with `bgen: 'x'` is rejected

### Interfaces
```ts
// src/core/choke.ts
export const CHOKES_RANGE = 1.7; // Splash's range, the game's shortest, in cells
export const CHOKES_APART = 3;   // minimum path steps between the two road cells
export function chokeCells(map: GameMap): Cell[]; // buildable cells within CHOKES_RANGE of two path cells >= CHOKES_APART apart
export function ensureChoke(map: GameMap): GameMap; // unchanged when a choke exists; else reroutes the last stretch to fold back on the one before
// src/core/map.ts
export function generateMap(rng: Rng, cols: number, rows: number, rocks: number, bgen: number = 2): GameMap;
```

`chokeCells`: for each `open` cell, scan `map.path` keeping first/last index with `Math.hypot(p.col - col, p.row - row) <= CHOKES_RANGE`; push the cell when `last - first >= CHOKES_APART`. `ensureChoke`: `if (chokeCells(map).length > 0) return map; return foldTail(map);`

`foldTail` (the exact algorithm — the path is a staircase: along-runs of 2-3 with sideways turns, always ending in an along-run; the fold only rewrites the tail, so nothing cascades):
```ts
const A = (c: Cell) => (map.vertical ? c.row : c.col), B = (c: Cell) => (map.vertical ? c.col : c.row);
const cell = (a: number, b: number): Cell => (map.vertical ? { col: b, row: a } : { col: a, row: b });
const length = map.vertical ? map.rows : map.cols;
// walk the tail back to its corners: iE = first cell of the last along-run, iP = corner P before it, iC = corner C before that, a = far end of the stretch ending at C
let iE = path.length - 1; const bE = B(path[path.length - 1]!);
while (iE > 0 && B(path[iE - 1]!) === bE) iE--;
const rB = A(path[iE]!);
let iP = iE - 1; while (iP > 0 && A(path[iP - 1]!) === rB) iP--;
const b = B(path[iP]!);
let iC = iP - 1; while (iC > 0 && B(path[iC - 1]!) === b) iC--;
const rA = A(path[iC]!);
let iH = iC; while (iH > 0 && A(path[iH - 1]!) === rA) iH--;
const a = B(path[iH]!);
if (rB !== rA + 2 && rB !== rA + 3) return map; // unreachable: runs are 2-3 cells
const b2 = b > a ? b - 1 : b + 1; // one step back into the stretch before C: always a lane, always inside its span (spans are >= 2)
const up = rB - rA === 3;         // the two horizontals are 3 rows apart: pull the last one up a row so they are 2 apart
const keep = up ? iC + 1 : iP;    // last old index that stays
const tail: Cell[] = up ? [cell(rA + 2, b), cell(rA + 2, b2)] : [cell(rA + 2, b2)];
for (let r = rA + 3; r < length; r++) tail.push(cell(r, b2));
const newPath = [...path.slice(0, keep + 1), ...tail]; // last cell is (length-1, b2): still on the exit edge; path[0] untouched
```
Then `kinds`: copy; set old path cells not in `newPath` back to `'open'`; the row between the stretches must stay buildable, so move any rock in the way: `protectedKeys = {`${k},${rA + 1}`} for k in [min(a,b)..max(a,b)]`; build a deduped move-list of `newPath` cells that are `'rock'` plus the choke cell `cell(rA + 1, b2)` if it is `'rock'`; for each: set it `'open'`, then first row-major `'open'` cell not in newPathKeys/protectedKeys becomes `'rock'` (if none, the rock is simply dropped — practically unreachable); finally set every `newPath` cell `'path'`. Return `{ ...map, kinds, path: newPath }`. The new choke is `(rA+1, b2)`: 1 cell from `(rA, b2)` and `(rA+2, b2)`, which are 4 path steps apart.

### Steps
1. Create `src/core/choke.ts` exactly as above (imports: `import type { Cell, GameMap } from './map';` — type-only, no runtime cycle).
2. Wire `generateMap` (`src/core/map.ts`): new param, doc line ("`bgen` 1 boards (old saves, old ghosts) are the board as grown; `bgen` 2 boards always have a choke cell"), and the final `return bgen >= 2 ? ensureChoke(map) : map;`.
3. Plumb the version: `RunState.bgen`, `SavedRun.bgen` + load rules, `RunSave.persist`, `GameScene` (ghost object + both call sites), `MenuScene`, `profile.ts` (`bestSeedBgen`, `RunResult.bgen`, `recordRun`), `GameOverScene`, then the `board.choke` invariant.
4. Update the three test files (mechanical, listed above), create `tests/core/choke.test.ts`.
5. `npm run check` then `npm run smoke`.

### Pitfalls
- No `rng` anywhere in the choke pass — it must be byte-deterministic, or the same seed stops giving the same board.
- `choke.ts` must import `map.ts` with `import type` only, or lint fails on the cycle (`map.ts` imports the value).
- The fold never touches `path[0]` or the exit edge: only indices after `keep` change; the last cell stays at along `length-1`. Do not "helpfully" normalize run lengths.
- Rock handling order: relocate before setting the new tail to `'path'`; the home scan must skip `newPathKeys` and `protectedKeys`, or a rock lands on the road or on the choke row; the choke cell itself may be a rock and must be in the move-list (dedupe it — it is never a path cell, but guard anyway).
- `up` case: old cells `(rA+3, b)` (old corner P) and the old last horizontal row become `'open'` via the "old path not in newPath" pass — don't hardcode the tail's old shape.
- Legacy rules: `SavedRun.bgen` missing → 1, corrupt → reject the save; `Profile.bestSeedBgen` missing with a `bestSeed` → 1. Getting either wrong puts resumed towers on the road (T0078's failure mode).
- `RunResult.bgen` is required — every `recordRun` call site (`GameOverScene`, `profile.test.ts`) must pass it or the build breaks.
- The `ghost.taken` invariant only needs truthiness, so the registry object is fine; just don't leave the old number cast in `GameScene`.

### Tests
- `tests/core/choke.test.ts`: for each of 14x8 and 8x14, seeds 1..50: `chokeCells` non-empty; each choke is `'open'` and really within 1.7 of two path cells `>= 3` steps apart; path continuous, no cell twice, in bounds, entrance/exit edges; rocks 4-5 and none on the path; same seed → `toEqual`. Plus: over 200 landscape seeds, every seed whose `bgen`-1 board already has a choke regenerates `toEqual` with `bgen` 2 (assert at least one such seed), and at least one seed has no `bgen`-1 choke whose `bgen`-2 board differs from it (the fold actually runs).

## Result (attempt 1, asus)

(no summary)

- Self-review: NO VERDICT
- Time: 365.2 min
- Self-review edits were discarded (checks failed at "check").

```
projects/chokepoint/game/src/core/choke.ts         | 113 +++++++++++++++++++++
 projects/chokepoint/game/src/core/map.ts           |   9 +-
 projects/chokepoint/game/src/core/profile.ts       |  15 ++-
 projects/chokepoint/game/src/core/run.ts           |   5 +-
 projects/chokepoint/game/src/core/saveRun.ts       |   4 +
 projects/chokepoint/game/src/debug/runChecks.ts    |   2 +
 .../chokepoint/game/src/scenes/GameOverScene.ts    |   2 +-
 projects/chokepoint/game/src/scenes/GameScene.ts   |  12 ++-
 projects/chokepoint/game/src/scenes/MenuScene.ts   |   2 +-
 projects/chokepoint/game/src/scenes/PauseScene.ts  |   2 +-
 .../chokepoint/game/src/scenes/RewardsScene.ts     |   2 +-
 projects/chokepoint/game/src/systems/RunSave.ts    |   1 +
 projects/chokepoint/game/src/ui/hud/StatsCard.ts   |   2 +-
 projects/chokepoint/game/tests/core/choke.test.ts  |  97 ++++++++++++++++++
 projects/chokepoint/game/tests/core/map.test.ts    |   6 +-
 .../chokepoint/game/tests/core/profile.test.ts     |  50 ++++-----
 .../chokepoint/game/tests/core/saveRun.test.ts     |  13 +++
 17 files changed, 295 insertions(+), 42 deletions(-)
```
