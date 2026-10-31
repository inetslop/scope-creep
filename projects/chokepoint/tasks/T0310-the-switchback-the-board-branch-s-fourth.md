---
id: T0310
title: "The switchback: the board branch's fourth node, a fold in the road"
assignee: inet-racing
size: M
priority: 1
status: in-progress
depends_on: []
attempts: 2
created: 2026-10-30T22:00:22Z
claimed_at: 2026-10-31T01:09:38Z
epic: E9
---

## Goal
A fourth node on the tech tree's board branch: when owned, every new board's road folds back on itself — one long straight stretch running parallel to another, a cell of island between. The island visibly gains a corridor of double cover, and the branch's depth-4 price (T0288) has something worth its 80 coins.

## Details
- **The node.** The board branch's fourth card, below "Two chokes" (T0297). Name: **The switchback**. Card line, dry one-liner: "The road folds back: a cell between two stretches." Price is the depth-4 value of T0288's formula (80 coins; the branch's other nodes read 10, 30, 50). Buying, the owned mark and persistence work exactly like the branch's other nodes.
- **The fold (the board rule).** With the node owned, the generated board's road gains one fold: a straight stretch of 3 to 5 road cells running parallel to another straight stretch of the road, with one cell of island between them (the strip cells are ordinary build cells), located in the middle third of the path — between 33% and 67% of the total path length from the entrance gate.
  - **A detour, not a fork.** Every enemy still walks the one road from the entrance gate to the exit gate. No second entrance, no enemy choice, and the spawn schedule, the "furthest along" progress and the gates are unchanged.
  - **Both orientations.** The fold exists on landscape (14x8) and portrait (8x14) boards, grid-aligned, with no bend cell inside either fold stretch.
  - **Nothing painted.** The strip cells are unmarked like every other cell (the board's own rule: no marks on the board). A tower placed in the strip has its range ring cover both stretches, so the corridor reads from the road and the ring — a first-time player sees a place where every tower covers two stretches of road without being told.
  - **The choke is untouched.** The board still has exactly one guaranteed choke cell (T0217); if it lands inside the strip, it is just one of the corridor's cells. Rocks, bend count, path length class and the entrance/exit generate as today; a board without the node is byte-identical to today's.
  - **The generator always succeeds**, with the same relax/retry discipline as the bend and choke placements: stretch length first (down to 3), then the gap (a two-cell strip, still double cover for every tower in the pool — every tower's range is 1.7 cells or more), then the position (anywhere on the path, still straight, still parallel, still inside the middle third when possible).
- **The player experience.** After the buy, every new run — and every ghost run, the fold's position driven by the board's seed — shows the fold: the road running alongside itself mid-board, a strip of buildable island between the two stretches. No new text, no new HUD element, no new board mark, no sound.
- **Why placing gets more interesting:** the board gains one obvious strong zone that was not there — the corridor — so the middle of the run has a visible answer, and the strip's extra cells room out the choke's neighbourhood (T0217, T0297) when the two sit close.
- **Closest example to build from:** the "Two chokes" node (T0297) — a new board-generation guarantee, a node card on the branch, and a pure seeded test.

## Acceptance criteria
- [ ] The tech tree's board branch shows a fourth card — "The switchback", 80 coins at depth 4 — below "Two chokes"; buying it spends the coins, wears the owned mark, persists across sessions and reads in the node's usual places.
- [ ] With the node owned, every generated board (both orientations, any seed) contains a fold: a straight 3-5 cell stretch parallel to another straight stretch, a 1- or 2-cell island strip between (the generator prefers 1), inside the middle third of the path; every enemy still walks the single road from entrance to exit.
- [ ] Every strip cell is buildable and unmarked; a range ring on one covers both stretches; the board still has exactly one guaranteed choke cell (T0217); a board of the same seed without the node is byte-identical to today's.
- [ ] A seeded unit test (both orientations, a spread of seeds) asserts the fold's presence and bounds with the node owned and its absence (byte-identical boards) without it; the desktop and mobile smoke tests pass.

## Design (architect, desktop)

### Files
- create `src/core/switchback.ts` — pure, no-Phaser, no-rng: `foldSwitchback(map)` inserts the fold; `switchbackFold(map)` detects it (for tests).
- create `tests/core/switchback.test.ts` — seeded test (both orientations) + `boardFold` reducer assertions.
- edit `src/content/tech/board.ts` — add `fold` to `BoardNode`, set it on the 3 nodes, change node 1 `price` 30→10, add the 4th node.
- edit `src/core/tech.ts` — add `boardFold(owned)` reducer next to `boardChokes`.
- edit `src/core/map.ts` — add `fold` param to `generateMap`, call `foldSwitchback` before `ensureChokes`.
- edit `src/scenes/GameScene.ts` — read `boardFold`, pass to `generateMap`, add `mapFold` field.
- edit `src/systems/RunSave.ts` — write `fold` into the saved run.
- edit `src/core/saveRun.ts` — add `fold` to `SavedRun` + validation + mapping.
### Interfaces
```ts
// content/tech/board.ts — BoardNode gains:  fold: boolean;   // node 1: price 30 -> 10 (the branch base)
// new node, appended after two-chokes:
{ id: 'switchback', name: 'The switchback', line: 'the road folds back: a cell between two stretches', price: 10, bends: 0, lengthMul: 1, chokes: 1, fold: true }
// core/tech.ts:
export function boardFold(owned: readonly string[]): boolean;   // true iff an owned node has fold true
// core/map.ts: generateMap(rng, cols, rows, rocks, extraBends=0, lengthMul=1, bgen=2, chokes=1, fold=false)
// core/switchback.ts:
export interface SwitchbackFold { a: Cell[]; b: Cell[]; gap: number; start: number; }
export function foldSwitchback(map: GameMap): GameMap;
export function switchbackFold(map: GameMap): SwitchbackFold | null;
// core/saveRun.ts: SavedRun gains  fold: number;   // 1 when "The switchback" was owned, 0 in older saves
```
### Steps
1. `board.ts`: add `fold: boolean;` to the interface; set `fold: false` on the three existing nodes; change `one-more-bend` `price` from 30 to 10 (this is the branch base that `nodeCost` reads as `branch[0].price`; it makes the row read 10/30/50 and the new node 80 = `nodePrice(10,4)`); add the `switchback` line.
2. `tech.ts`: `boardFold` mirrors `boardChokes` but returns `BOARD_NODES.some((n) => owned.includes(n.id) && n.fold)` (dedupe like the others).
3. `map.ts`: add `fold = false` param; before the `return`, build `const folded = fold ? foldSwitchback(map) : map;` and `return bgen >= 2 ? ensureChokes(folded, chokes) : folded;`. Import `foldSwitchback`.
4. `switchback.ts` — `foldSwitchback`: work in along/across space exactly like `foldTail` (`A/B/cell` helpers, `length = vertical?rows:cols`, `width = vertical?cols:rows`). Deterministic relax/retry, no rng: for phase in [middle-third, anywhere]; for gap in [1,2]; for L in [5,4,3]; for d in [+1,-1]; for iP in the phase's index range — take `P=path[iP]`, `a0=A(P)`, `b=B(P)`, `bFar=b+3*d`; skip unless `0<=bFar<width` and `a0+L-1<=length-1`; build `newPath = path.slice(0,iP+1)` + stretchA (`a0+1..a0+L-1` at lane b) + `cell(a0+L-1,b+d),cell(a0+L-1,b+2d)` + stretchB (`a0+L-2..a0` at lane b+2d) + `cell(a0,b+3d)` + suffix (`a0+1..length-1` at lane b+3d). Skip unless `valid(newPath)` (in-bounds, side-adjacent, no cell twice, last cell `A===length-1`) AND, in the middle-third phase, `iP/newPath.length` in [1/3,2/3]. On the first hit, `rebuild` and return. `rebuild` is a copy of `foldTail`'s tail (choke.ts:102-139): clone kinds, dropped old-path cells→'open', new path→'path', relocate rocks onto new path cells, and protect one strip choke `cell(a0+((L-1)>>1), b+d)` from rocks. Return `map` unchanged if no candidate (should not happen).
5. `switchbackFold` (detector, for tests): split `path` into maximal straight runs (constant step direction); return the first pair of main-axis runs (both moving along the entrance→exit axis) that are parallel, at across-offset 2 or 3 (gap 1 or 2), each length 3-5, overlapping in along-range, whose between-strip cells are all 'open', and whose earlier run's start index/`path.length` is in [1/3,2/3]; else null. `start` = that index, `a`/`b` = the two runs' cells.
6. `GameScene.ts`: add field `mapFold = 0;` next to `mapChokes` (line 54); after line 114 add `const fold = saved ? saved.fold : boardFold(loadProfile(window.localStorage).purchased);`; add `this.mapFold = fold;` after line 119; pass `fold` as the last arg to `generateMap` (line 117); import `boardFold`.
7. `RunSave.ts`: add `fold: this.game.mapFold,` after the `chokes:` line (40). `saveRun.ts`: add `fold: number;` to the interface (after `chokes`, line 40), validation `if (p.fold !== undefined && p.fold !== 0 && p.fold !== 1) return undefined;` (after line 98), and `fold: p.fold === 1 ? 1 : 0,` in the return (after line 127).
### Pitfalls
- Base price: changing node 1 `price` 30→10 also re-prices the other unowned board nodes (30/85/155 → 10/30/50). That is required for the new node to be 80 and matches the task; do not "restore" the 30.
- Suffix reuse: the fold's suffix runs at lane `b+3d`; never emit a cell already in the prefix or stretchB — `valid()`'s no-duplicate check is the guard, keep it.
- Rocks: the fold runs after rock placement, so `rebuild` must relocate rocks off new path cells (copy `foldTail`, don't skip it) or a rock ends up under the road.
- Without the node the board must be byte-identical: `fold=false` (the default) must not touch the path — the `fold` param is a no-op when false.
- `fold` must be saved in the run or a resumed run regenerates its board without the fold (copy the `chokes` handling in `saveRun.ts`/`RunSave.ts`).
### Tests
- `tests/core/switchback.test.ts`: for 14x8 and 8x14, seeds 1..50 (and a bends×lengthMul sweep like `twoChokes.test.ts`): `folded = generateMap(seed,…,2,1,true)` is a valid path (`expectValidPath`, copied from twoChokes.test.ts), `switchbackFold(folded)` is non-null with `gap` 1-2 and both runs 3-5; deterministic (`folded` equals a second identical call); `plain = generateMap(seed,…,2,1,false)` equals `generateMap(seed,…,2,1)` (byte-identical, no fold param effect). Plus: `boardFold([])` false, `boardFold(['switchback'])` true, `nodeCost(BOARD_NODES,'switchback')` is 80, and `buyBoardNode` at 80 coins spends/persists.

## Attempt 1 failed (inet-racing)

The agent made no changes to the game (timeout).
