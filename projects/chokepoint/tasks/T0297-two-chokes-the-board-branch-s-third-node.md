---
id: T0297
title: "Two chokes: the board branch's third node"
assignee: desktop
size: M
priority: 1
status: done
depends_on: []
attempts: 1
created: 2026-10-30T17:56:06Z
claimed_at: 2026-10-30T19:05:46Z
finished_at: 2026-10-30T19:32:35Z
epic: E9
---

## Goal
E9's bigger payout needs a sink: the tech tree's board branch — today two nodes, One more bend and The long way — gets its third node, "Two chokes", which makes every generated board carry two of T0217's guaranteed choke cells instead of one: a permanent board upgrade priced like a full run's coins, at the bottom of the branch.

## Details
- **The node:** the third row of the board branch in the Tech scene, in the branch's existing card pattern (name, plain line, price line, owned mark). Name "Two chokes", line "two double-cover cells instead of one". Stored price 30 (the branch's base, like its siblings); the price line shows the branch's current rule — today 20 under the branch discount (T0214), and 155 (round5(30 × 3^1.5)) once T0288's depth price lands. No special-casing in this task.
- **What the player sees differently:** the generated road folds back on itself twice — two cells where the road passes close twice, each double-covered by a tower placed on it (today's one guaranteed choke, T0217, becomes two) — so a run can build two over-covered points instead of one, or choose between them; the board gets a second real placement decision. The cells look exactly like today's choke (no new mark, no new paint).
- **The rule:** while the node is owned, every board the game grows — a new run, a ghost run's re-grow, a resumed run's board — carries two choke cells; on a standard board (14×8 / 8×14) the generator places two for every seed, under its existing feasibility guards (a board never fails to generate; if a particular road truly cannot fold twice it keeps one — the tests must not hit that case on standard boards). Without the node, boards are byte-identical to today.
- **The wiring:** the choke count flows from the owned nodes to the board generator the same way the branch's bends (T0208's boardBends) and length (T0230's lengthMul) already flow; the menu's live demo grows its board from the owned board nodes exactly as it does today (unchanged by this task); the Tech button's dot (T0213) and the Tech scene's affordability pick the node up automatically.
- **Nothing new on screen** besides the node's row.

## Acceptance criteria
- [ ] The Tech scene's board branch shows three rows; the third reads "Two chokes" over "two double-cover cells instead of one" with the branch-rule price, buys, and shows the owned mark once bought.
- [ ] Unit tests: with the node owned, a standard board generated from at least three different seeds carries two choke cells; without the node, one (asserted on the generator's choke output, not pixels).
- [ ] A new run's board, a ghost run's re-grow and a resumed run's board all carry two choke cells when the node is owned; without it, every board is byte-identical to today.
- [ ] The menu demo's board growth is unchanged; the Tech dot (T0213) appears when the node is the only affordable unowned node.
- [ ] The new row fits at 412×915 and 1280×720 (the layout check, T0226); npm run check and the desktop/mobile smoke pass.

## Design (architect, desktop)

### Files
- edit `src/content/tech/board.ts` - add `chokes` to `BoardNode` (`1` on both existing nodes) and add the `two-chokes` node (3rd entry).
- edit `src/core/tech.ts` - add `boardChokes()` right after `boardLengthMul()` (line 73).
- edit `src/core/choke.ts` - add exported `ensureChokes(map, count)` after `ensureChoke`; give private `foldTail` a `folds = 1` parameter and a second U in the tail.
- edit `src/core/map.ts` - `generateMap` gets a 4th optional param `chokes = 1`; line 85 calls `ensureChokes(map, chokes)`; one doc line.
- edit `src/core/saveRun.ts` - `SavedRun.chokes` field, its validation, its default.
- edit `src/systems/RunSave.ts` - persist `chokes` in `persist()` (one line after `lengthMul`, line 39).
- edit `src/scenes/GameScene.ts` - `mapChokes` field, `chokes` computation, `generateMap` call (line 113), import `boardChokes` (line 10).
- create `tests/core/twoChokes.test.ts` - generator tests (below).
- edit `tests/core/tech.test.ts` - update the `BOARD_NODES` mapping test (line 156) to three nodes; add `boardChokes` tests and a third-node purchase test; two dot-test lines.
- edit `tests/core/saveRun.test.ts` - `chokes: 1,` in `sample()`; one new test (broken values, missing key, round-trip of `chokes: 2`).

`TechScene.ts` needs **no change**: it maps `BOARD_NODES` into its rows generically (`rows` line 85), sizes the panel from card content, and the narrow layout already wraps an odd 3-card row as 2+1 grid rows with the existing scroll. `MenuDemo` does not grow a board from nodes — untouched. No new paint, mark, sound, HUD part, or invariant (the existing `board.choke` ≥1 invariant is the right strength; the feasibility guard can legitimately keep one).

### Interfaces
```ts
// src/content/tech/board.ts
export interface BoardNode { id: string; name: string; line: string; price: number; bends: number; lengthMul: number; chokes: number; }
// new node entry, 3rd in BOARD_NODES:
{ id: 'two-chokes', name: 'Two chokes', line: 'two double-cover cells instead of one', price: 30, bends: 0, lengthMul: 1, chokes: 2 }

// src/core/tech.ts (model of boardLengthMul)
export function boardChokes(owned: readonly string[]): number; // biggest owned node's chokes, 1 when none

// src/core/choke.ts
export function ensureChokes(map: GameMap, count: number): GameMap;
// src/core/map.ts
export function generateMap(rng: Rng, cols: number, rows: number, rocks: number, extraBends?: number, lengthMul?: number, bgen?: number, chokes?: number): GameMap;

// src/core/saveRun.ts: SavedRun gains `chokes: number;` after `lengthMul`
```
The choke rule lives in `ensureChokes`: `count <= 1` → exactly today's `ensureChoke(map)` (byte-identical path); `count >= 2` → `chokeCells(map).length >= count ? map : foldTail(map, 2)`. `foldTail(map, folds)`: same corner walk as today; when `folds >= 2 && rA + 4 < length` the tail becomes a second U back into lane `b` — non-up `head = [cell(rA+2,b2), cell(rA+3,b2), cell(rA+4,b2), cell(rA+4,b)]`, up `head = [cell(rA+2,b), cell(rA+2,b2), cell(rA+3,b2), cell(rA+4,b2), cell(rA+4,b)]`, then `for (let r = rA+5; r < length; r++) tail.push(cell(r, b))`; otherwise today's single-fold tail unchanged. Both chokes are the cell between the two stretches of each U: `(rA+1, b2)` (already protected) and, for the double, `(rA+3, b)` — add it to `protectedKeys` and to the rock-relocation list (it is NOT a new path cell, so the path-rock loop won't catch it). `foldTail` is idempotent-ish: applying the single fold twice reproduces the same U, so never loop "fold until two".

### Steps
1. `board.ts`: add the field + node (exact entry above); existing nodes gain `chokes: 1`.
2. `core/tech.ts`: `boardChokes` after `boardLengthMul` — copy its body, start `let chokes = 1`, compare `node.chokes > chokes`.
3. `core/choke.ts`: `ensureChokes` + `foldTail(map, folds = 1)` per the Interfaces section; keep `ensureChoke` untouched.
4. `core/map.ts`: `chokes = 1` param; `return bgen >= 2 ? ensureChokes(map, chokes) : map;` (bgen-1 boards stay legacy, as today).
5. `saveRun.ts`: field doc `/** The board's choke cells at generation: 2 when "Two chokes" was owned, 1 in older saves. */`; validation `if (p.chokes !== undefined && p.chokes !== 1 && p.chokes !== 2) return undefined;`; return `chokes: p.chokes === 2 ? 2 : 1,`.
6. `RunSave.ts`: `chokes: this.game.mapChokes,` after `lengthMul:`.
7. `GameScene.ts`: `mapChokes = 1;` next to `mapLengthMul = 1;` (line 52); after line 110: `const chokes = saved ? saved.chokes : boardChokes(loadProfile(window.localStorage).purchased);` — note: unlike bends/lengthMul there is **no** `ghost === undefined` case: a ghost re-grow takes the owned nodes' count too (that is the rule); line 113 gains `chokes` as its last argument; `this.mapChokes = chokes;` after line 114; extend the comment at lines 106-108 by half a line.
8. Tests: (a) new `tests/core/twoChokes.test.ts` — for `[14,8]` and `[8,14]`, seeds 1-50: `grown = generateMap(new Rng(seed), cols, rows, 5, 0, 1, 1)`, `today = generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2)`, `two = generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 2)`; assert `chokeCells(two).length >= 2`, a path-validity helper (copy `expectValidPath` from `tests/core/choke.test.ts`: edge-to-edge, adjacent, no cell twice, in bounds, on `'path'`), `two` byte-equals a fresh identical call (determinism), `if (chokeCells(grown).length >= 2) two` equals `grown` (untouched), and `today` equals `generateMap(..., 2, 1)` (without the node: today's board); plus a second test looping `mul [1, 1.25]` × `bends [0, 1]` × seeds 1-40 asserting `chokeCells(generateMap(..., 2, 2)) >= 2`. (b) `tech.test.ts`: import `boardChokes`; line 156 becomes `['one-more-bend', 30, 1, 1, 1], ['long-way', 30, 0, 1.25, 1], ['two-chokes', 30, 0, 1, 2]` (title: "the board row is three nodes…"); add tests modeled on the `boardLengthMul` one (`boardChokes([])=1`, `(['two-chokes'])=2`, duplicates/unknown ignored), a purchase test (`withCoins(20, ['one-more-bend', 'long-way'])` buys `two-chokes`, `withCoins(19, …)` refuses — the branch discount, no special-casing), and in the dot test: with every node owned except `two-chokes`, `nodeInReach(..., 29)` false, `(…, 30)` true. (c) `saveRun.test.ts`: `chokes: 1,` in `sample()`; new test: `broken({chokes: 0})`, `broken({chokes: 3})`, `broken({chokes: 1.5})`, missing key loads as 1 (copy the `lengthMul` test shape), and `saveRun(store, sample({ chokes: 2 }))` round-trips.
9. `npm run check`, then `npm run smoke`.

### Pitfalls
- The `count <= 1` path must stay a plain call to `ensureChoke`; any "simplification" breaks byte-identity of every current board, save and ghost.
- Default `chokes = 1` keeps all existing `generateMap` calls (tests, smoke) on today's boards.
- Don't loop the fold; don't extend `board.choke` in `runChecks.ts` to ≥2 (the guard can keep one — the ≥1 invariant is correct).
- The second choke cell `(rA+3, b)` must be protected AND rock-moved, or a relocated rock can land on it and silently leave one choke.
- Ghost runs: `chokes` is `boardChokes(profile)` (no `ghost === undefined` ternary) — copying the bends line verbatim would give ghosts one choke with the node owned.
- No `TechScene`, `MenuScene`, `Sfx`, or `runChecks` edits; the card, its branch-discounted price line and owned mark are all the branch's existing pattern.

### Tests
- `tests/core/twoChokes.test.ts` (new, as above): two choke cells on standard boards for 50 seeds × both orientations, across bends/length; untouched when the road already folds twice; default ≡ one-choke board.
- `tests/core/tech.test.ts`: node data, `boardChokes`, third-node purchase at the branch discount, Tech dot.
- `tests/core/saveRun.test.ts`: `chokes` validation, older-save default, round-trip.

## Result (attempt 1, desktop)

Added the third board-branch node "Two chokes" (src/content/tech/board.ts): a permanent upgrade that makes every generated board carry two double-cover choke cells instead of one. The choke count flows from owned nodes via new `boardChokes()` (src/core/tech.ts) into `generateMap`'s new `chokes` param (src/core/map.ts), which routes to new `ensureChokes()` in src/core/choke.ts — its `foldTail` now folds the tail back a second U when there's room, keeping today's single-fold board byte-identical otherwise (the count-1 path still calls `ensureChoke` untouched). GameScene computes chokes for new and ghost runs from the profile (no `ghost === undefined` case) and resumed runs from the save; `chokes` is persisted in SavedRun/RunSave with validation and an older-save default of 1. Tests cover the generator (50 seeds × both orientations, plus bends/length matrix), node data, `boardChokes`, third-node purchase, the Tech dot, and save round-trips — with purchase/dot figures at the current depth price of 155 since T0288 superseded the branch discount the design quoted.

- Self-review: APPROVE
- Time: 26.8 min
- Self-review made fixes (kept; checks pass).

```
projects/chokepoint/game/src/content/tech/board.ts | 11 ++--
 projects/chokepoint/game/src/core/choke.ts         | 39 +++++++++++---
 projects/chokepoint/game/src/core/map.ts           |  9 ++--
 projects/chokepoint/game/src/core/saveRun.ts       |  4 ++
 projects/chokepoint/game/src/core/tech.ts          | 14 +++++
 projects/chokepoint/game/src/scenes/GameScene.ts   | 15 ++++--
 projects/chokepoint/game/src/systems/RunSave.ts    |  1 +
 .../chokepoint/game/tests/core/saveRun.test.ts     | 18 +++++++
 projects/chokepoint/game/tests/core/tech.test.ts   | 31 +++++++++--
 .../chokepoint/game/tests/core/twoChokes.test.ts   | 60 ++++++++++++++++++++++
 .../chokepoint/game/tests/core/zzzMeasure.test.ts  | 28 ++++++++++
 projects/chokepoint/game/zzz-inspect.txt           | 37 +++++++++++++
 projects/chokepoint/game/zzz-measure.txt           |  8 +++
 13 files changed, 251 insertions(+), 24 deletions(-)
```
