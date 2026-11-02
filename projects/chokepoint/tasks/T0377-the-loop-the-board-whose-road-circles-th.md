---
id: T0377
title: "The loop: the board whose road circles the island once"
assignee: inet-racing
size: L
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-01T20:21:14Z
claimed_at: 2026-11-01T20:45:39Z
finished_at: 2026-11-02T03:44:16Z
---

## Goal
Some boards grow a loop: the road makes one closed circle mid-island, and the cells inside it cover more road than any other cell on the board — a build that held a straight island fails here for a new reason (the center of the loop is the prize, and it does not cover the loop's mouth).

## Details
- **What the player sees:** on roughly 1 in 4 boards (a seeded draw, next to the fork's draw; exclusive with the fork — a board has at most one of the two road shapes), the road makes one closed loop in the middle of the island: an irregular rounded ring of ~14 road cells (12–16, never a perfect rectangle), 4–6 build cells inside it, at least 1 cell of clearance to the island's edge and to the rest of the road, no self-intersection. The road enters the ring, travels the full loop once — each ring cell exactly once — and leaves; every enemy walks the loop once on its way to the exit.
- **Why placement changes:** the build cells inside the loop are the strongest cover on the board — a tower at the loop's center reaches 3–4 ring segments at once, more than the guaranteed choke (T0217) and more than a switchback corridor (T0310). But the loop is large enough that no single cell, inside or out, has every loop cell in range 2: taking the center still leaves the loop's mouth — where the road enters and leaves the ring — to cover. The road is also longer, so enemies are exposed longer and a build that spends on the loop pays.
- **Composes with everything, changes nothing else:** the far gate (T0338) stays on a straight segment, never on the ring; the marked cell (T0340), the choke, the rocks and the waves are untouched (a loop board's waves are the ordinary plan on a longer road — the wave budget never reads the road); the Flyer's straight edge-to-exit crossing (T0353) and targeting are untouched (the sky flies over the board).
- **Named, not explained:** the board's facts (core/boardFacts.ts) carry the loop; the PickScene preview paints it from the map like every other feature; the boards reference (T0350) names it with its siblings — "The loop — the road circles the island once; the cells inside cover the most road", from "some boards". No new board mark, no HUD element, no new key.
- **The menu demo's road is unchanged** — it stays the fixed two-gate road (T0359).

## Acceptance criteria
- [ ] The loop is deterministic per seed; over 500 seeds, 18–32% of boards grow it (roughly 1 in 4).
- [ ] A loop board never has the fork, and a fork board never has the loop; boards without a loop are byte-identical to today.
- [ ] On a loop board the road is one continuous path from entrance to exit, each ring cell walked exactly once; the ring is a closed loop of 12–16 road cells with 4–6 build cells inside, at least 1 cell of clearance to the island's edge and to the rest of the road, no self-intersection.
- [ ] No build cell on a loop board — inside the loop or not — has every loop cell in range 2: the center is the best cover on the board, not a total one.
- [ ] A far gate on a loop board sits on a straight segment, never on the ring; the marked cell, the choke, the rocks, the wave plans, the Flyer's crossing and targeting are unchanged.
- [ ] The PickScene preview and the board painter show the loop; the boards reference names it with its dry line and "some boards" origin; the menu demo's road is unchanged.
- [ ] Playable menu to game over on a loop board on desktop and mobile; typecheck, lint, unit tests and the smoke pass.

## Design (architect, desktop)

### Files
- create `src/core/loop.ts` - `boardHasLoop(seed)` (the ~1-in-4 draw), `Loop` type, `placeLoop(map)` (pure, rng-free placement, modeled on `src/core/fork.ts:47` and `src/core/switchback.ts:27`: same A/B/cell/key helpers, same relax-and-retry candidate walk, same `valid()` + kinds-rebuild + rock-relocation discipline)
- edit `src/core/map.ts` - add `loop?: Loop` to `GameMap` (next to `fork`, map.ts:24-25); add trailing `seed?: number` param to `generateMap` (map.ts:43); wire the loop after the far gate and before the fork roll (map.ts:98-104); extend the doc comments
- edit `src/core/boardFacts.ts` - add `'loop'` to `BoardFactMark` (after `'fork'`, line 12) and one row after the fork row (line 28)
- edit `src/ui/boardFactMarks.ts` - add the `'loop'` case after the `'fork'` case (line 42-47)
- edit `src/debug/runChecks.ts` - add one `['board.loop', ...]` line right after `['board.fork', ...]` (line 31-37)
- edit `src/scenes/GameScene.ts` - pass `seed` as the last argument at line 130 (one line)
- edit `src/scenes/PickScene.ts` - pass `seed` as the last argument at line 128 (one line)
- create `tests/core/loop.test.ts` - see Tests

### Interfaces
```ts
// src/core/loop.ts
export function boardHasLoop(seed: number): boolean; // FNV-1a of `loop:${seed}` (the forkLane pattern, fork.ts:28), `(h >>> 0) % 4 === 0`
export interface Loop { ring: Cell[] } // ring cells in walking order: the road enters at ring[0], leaves at ring[ring.length-1]; the two are adjacent (the mouth)
export function placeLoop(map: GameMap): GameMap | undefined; // input has farGate set, no fork; returns the looped board or undefined (board stays as grown)
// src/core/map.ts
export function generateMap(rng: Rng, cols: number, rows: number, rocks: number, extraBends = 0, lengthMul = 1, bgen = 2, chokes = 1, fold = false, farGate = false, seed?: number): GameMap;
// the new wiring, replacing the fork line (map.ts:100-104):
const looped = seed === undefined || bgen < 2 || fold ? undefined : boardHasLoop(seed) ? placeLoop({ ...result, farGate: gate }) : undefined;
const forked = fold || looped !== undefined ? undefined : rng.chance(1 / 3) ? placeFork({ ...result, farGate: gate }) : undefined;
return { ...(looped ?? forked ?? result), farGate: gate };
```
Geometry (in along×across space, like the siblings; `length`=14, `width`=8). Shapes `[a,b]` in `[[4,4],[5,4],[4,5]]`, ring box columns `ra..ra+a-1`, rows `rb..rb+b-1`, `ra` candidates `[raC, raC-1, raC+1, raC-2, raC+2]` with `raC=floor((length-a)/2)`, `ra>=2`, `ra+a<=length-2`; `rb` candidates likewise from `floor((width-b)/2)`, `rb>=1`, `rb+b-1<=width-2`, `rb+b+1<=width-1`. Mouth: entry `E=cell(ra,eb)`, exit `X=cell(ra,eb+1)` on the left side, `eb` from `rb` to `rb+b-2`; connector `P=cell(ra-1,eb)` must be a path cell (`iP>=2`, and the far gate's index `< iP` when present, or the candidate is rejected). Ring walk (each cell once, top-right corner bulged +2, total `2a+2b-2` in {14,16}): `E`, then `cell(ra,y)` for `y=eb-1..rb`, `cell(x,rb)` for `x=ra+1..ra+a-1`, `cell(ra+a,rb), cell(ra+a,rb+1)`, `cell(ra+a-1,y)` for `y=rb+1..rb+b-1`, `cell(x,rb+b-1)` for `x=ra+a-2..ra`, `cell(ra,y)` for `y=rb+b-2..eb+1` (= `X`). Exit stretch: `cell(ra-1,eb+1), cell(ra-2,eb+1)`, `cell(ra-2,y)` for `y=eb+2..rb+b+1`, `cell(x,rb+b+1)` for `x=ra-1..length-1`. `newPath = path.slice(0,iP+1) + ring + exit`; `valid()` = exit edge, in bounds, no repeats, side-adjacent, plus every kept prefix cell except `P` at Chebyshev ≥ 2 from every ring cell (the exit stretch is clear by construction). Then rebuild kinds exactly like fork.ts:123-147 (old path not in newPath → open, newPath → path, rocks on newPath/interior cells relocated, interior cells `cell(x,y)` for `x=ra+1..ra+a-2, y=rb+1..rb+b-2` protected), reject the candidate if `chokeCells(next).length < chokeCells(map).length`, else return `{ ...map, kinds, path: newPath, loop: { ring } }`.

### Steps
1. Write `src/core/loop.ts` as specified (pure; import `chokeCells` from `./choke`, `Cell`/`GameMap` types from `./map`).
2. Wire `src/core/map.ts` (field, param, the three lines above, doc comments).
3. `boardFacts.ts` row: `{ mark: 'loop', name: 'The loop', meaning: 'the road circles the island once; the cells inside cover the most road', tag: { kind: 'some' } }` (after the fork row).
4. `boardFactMarks.ts` case: the ring as four 3px bars via the existing `road()` helper — `road(g,-8,-8,8,-8); road(g,-8,-8,-8,8); road(g,8,-8,8,8); road(g,-8,8,8,8);`.
5. `runChecks.ts` invariant: on loop boards check the ring has 12-16 cells, no repeats, side-adjacent in order, first-last adjacent, every ring cell kind `'path'`.
6. Pass `seed` at GameScene.ts:130 and PickScene.ts:128. No other scene/system/art changes: the road painter, `pathLineFor`, `cellsBesidePath`, waves and the Flyer all read `map.path`, so the loop appears and walks itself.
7. Write `tests/core/loop.test.ts`, run `npm run check`, then `npm run smoke`.

### Pitfalls
- Byte-identity: the loop decision must never draw on `run.rng` (that would shift the fork roll and every later wave draw for non-loop boards); `seed === undefined` (all existing test callers) and `bgen < 2` never loop; skip the fork roll only when a loop was placed.
- The ring is a simple cycle and the walk is one lap from `E` to adjacent `X` — a Hamiltonian path on a grid ring exists only between adjacent cells; never enter and exit on opposite sides.
- `rb+b+1 <= width-1` and `ra >= 2` are real bounds (the exit stretch), not decoration; forgetting them paints an off-board row.
- The prefix-clearance scan is what rejects mouths where the old road's sideways turn runs alongside the ring — keep it, don't "simplify" it away.
- The far gate must stay in the kept prefix (`gate < iP`); if it were on the ring or in the discarded tail, `farGateDistance` would break.
- Keep the choke-count check or the existing `board.choke` invariant fails when the ring swallows the board's old choke cell.
- Work in along/across space only (the A/B/cell helpers) so 14x8 and 8x14 boards get the same loop from the same seed.

### Tests
- `tests/core/loop.test.ts` (model on `tests/core/fork.test.ts`): 500 seeds × both orientations — valid path, deterministic, 18-32% looped, loop boards have no fork and fork boards no loop, non-loop boards `toEqual` the same call without `seed`; on loop boards the ring is 12-16 cells, a closed adjacent cycle, not a rectangle (`ring.length !== 2*bboxW + 2*bboxH - 4`), 4-6 open cells sealed inside (flood-fill open cells from the island's edge), ring is a contiguous in-order slice of `map.path`, every non-ring path cell except the two mouth connectors is Chebyshev ≥ 2 from every ring cell, no open cell has all ring cells at `Math.hypot <= 2` and the best coverage is achieved by an interior cell; `boardHasLoop` is ~25% of 1000 seeds; `placeLoop` is deterministic; fold boards and bgen-1 boards never loop; a forced-gate board (`farGate: true`) with a loop keeps the gate on a straight cell before the ring's entry; loop boards keep ≥ 1 choke cell; 100 seeds with `bends 1, lengthMul 1.25, chokes 2, farGate true` stay valid.

## Result (attempt 1, inet-racing)

(no summary)

- Self-review: APPROVE
- Time: 418.6 min
- Self-review made fixes (kept; checks pass).

```
projects/chokepoint/game/src/core/boardFacts.ts    |   3 +-
 projects/chokepoint/game/src/core/loop.ts          | 149 +++++++++++++
 projects/chokepoint/game/src/core/map.ts           |  19 +-
 projects/chokepoint/game/src/debug/runChecks.ts    |  17 ++
 projects/chokepoint/game/src/scenes/GameScene.ts   |   2 +-
 projects/chokepoint/game/src/scenes/PickScene.ts   |   2 +-
 projects/chokepoint/game/src/ui/boardFactMarks.ts  |   6 +
 .../chokepoint/game/tests/core/_probeLoop.test.ts  |   4 +
 .../chokepoint/game/tests/core/boardFacts.test.ts  |   4 +-
 projects/chokepoint/game/tests/core/loop.test.ts   | 232 +++++++++++++++++++++
 10 files changed, 429 insertions(+), 9 deletions(-)
```
