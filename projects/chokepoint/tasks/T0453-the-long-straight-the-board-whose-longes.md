---
id: T0453
title: "The long straight: the board whose longest straight is 7+ cells (the T0438 re-file)"
assignee: asus
size: L
priority: 2
status: in-progress
depends_on: []
attempts: 2
created: 2026-11-02T23:41:13Z
claimed_at: 2026-11-03T04:29:37Z
design_attempts: 1
---

## Goal
About one board in five grows one long straight — the road's longest straight run of cells is at least 7 — so the board has a stretch a single long-range tower can cover from one side: the player reads the straight against the choke, and the sniper's build gets a board of its own. (The T0438 re-file: that task failed at the design stage with no design produced; the spec below is unchanged, re-filed for the strongest machine.)

## Details
- **The shape.** On these boards the road's longest straight run of road cells is at least 7 — one module constant (7, or the next longer value that keeps the ~1-in-5 rate, if today's generator already runs that long). Choose the constant by measuring the generator's longest-straight distribution over a fixed batch of seeds and taking the value ~20% of boards reach, then pin it in the test. The rest of the road generates exactly as today. The straight is visible as a long unbroken run of white road; nothing is painted on it or beside it (the board's own bar: the player sees the straight from the road itself).
- **The frequency.** ~1-in-5 boards, decided by the seed hash the way the cove and the twin decide theirs — the decision and the shape derive from the board's own seed, stable across resumes and ghost replays (the board grows from the seed, so the run save is untouched).
- **The exclusivity.** Exclusive with the fork and the loop (both already reshape the whole road); it coexists with the cove, the twin, the marked cell, the double mark, the far gate, the slow stretch and the rocks exactly as those coexist with each other.
- **Why placing gets more interesting.** A straight has no bends of its own, so the board's guaranteed choke (T0217) sits off it: the board's question is cover the straight or hold the choke. A Reach (or Reach-heavy) tower at the straight's edge covers most of the straight from one cell, and enemies on it walk the open longest of any board — a different optimal build from the cove's pocket or the loop's long folds (the sniper's board, in the boards reference's own language).
- **The reads.** The boards reference gains its row: "The long straight — some boards", with its own committed seed and mini board (the twin row's pattern, the next free committed seed); the board facts name it like the other modifiers (the fact reads the constant: "the road's longest straight is N+ cells").
- **No new teach, mark, HUD element, key or sound** — the marked cell's and the cove's pattern: the shape is visible on the board, named in the reference.

## Acceptance criteria
- [ ] ~1-in-5 boards (a hash-rate test, the cove's and the twin's own test pattern) carry a road whose longest straight run is at least the module constant (7 or longer), deterministic per seed; no-hash boards keep today's roads byte-identically; fork and loop boards never carry it.
- [ ] The board facts name the modifier and the boards reference shows its row with a committed-seed mini board whose longest straight is visibly long; the cove, twin, marked cell and double-mark tests are untouched (no exclusivity with them).
- [ ] A run on a long-straight board plays and resumes identically to its seed (nothing in the run save); a runChecks invariant (hash ⇒ longest straight ≥ the constant) passes; `npm run check` and the desktop + mobile smoke pass.

## Design (architect, cachyos-x8664)

Add "the long straight" as a board trait — a property of the road's longest straight stretch, decided by the seed's grown board (like cove/twin) and exclusive with the fork and the loop. No field, no reshape, no new scene.

### Files

Create:
- `src/core/longStraight.ts` — the long straight's own module (pure, no Phaser).
- `tests/core/longStraight.test.ts` — the long straight's own tests (the cove/twin/marked-cell/double-mark tests are untouched).

Modify:
- `src/core/boardFacts.ts` — add `'longstraight'` to `BoardFactMark`, one row to `BOARD_FACTS`, and `longstraight: { seed: S }` to `BOARD_FACT_SEEDS` (S = the next free committed seed).
- `src/debug/runChecks.ts` — one `board.longStraight` invariant next to the board invariants + its import.
- `tests/core/boardFacts.test.ts` — twelve → thirteen modifiers (the marks array gains `'longstraight'`), one `case 'longstraight'` in the `facts` switch + the `boardHasLongStraight` import.

No change (the pattern is data-driven / a property): `src/core/map.ts` (the road generates exactly as today; the long straight is not a field), `src/scenes/BoardFactsScene.ts` (iterates `BOARD_FACTS`, grows the committed-seed board via `boardFactMap`, reads the tag — a new row needs no scene change), `src/ui/boardFactMarks.ts` (dead; C1 says no new mark), `src/config.ts`, `content/`, `main.ts`, `SCENES`.

### Interfaces

- New `src/core/longStraight.ts` exports:
  - `export const LONG_STRAIGHT_MIN: number` — the module constant (7, or the next longer value that keeps the ~1-in-5 rate).
  - `export function longestStraight(path: readonly Cell[]): number` — the road's longest straight run: `let m = 0; for (const s of roadStretches(path)) m = Math.max(m, s.end - s.start + 1); return m;` (`roadStretches` is in `core/cove.ts`, **not** `core/path.ts`; a stretch `[start, end]` is an inclusive path-index range, run = `end - start + 1`).
  - `export function boardHasLongStraight(map: GameMap): boolean` — `!map.fork && !map.loop && longestStraight(map.path) >= LONG_STRAIGHT_MIN`.
- `src/core/boardFacts.ts` (existing exports, modified): `BoardFactMark` gains `'longstraight'`; `BOARD_FACTS` gains the row `{ mark: 'longstraight', name: 'The long straight', meaning: <one line, the twin row's pattern>, tag: { kind: 'some' } }` (→ `boardFactTag` returns "some boards"); `BOARD_FACT_SEEDS` gains `longstraight: { seed: S }` (S = the smallest free seed — not in {1..15} — whose 8x14 portrait board, grown exactly as `boardFactMap` does — `generateMap(new Rng(S), 8, 14, 5, 0, 1, 2, 1, false, false, S)` — has `boardHasLongStraight` true).

### Steps

1. Create `src/core/longStraight.ts` (imports: `roadStretches` from `./cove`; `type { Cell, GameMap }` from `./map`): `LONG_STRAIGHT_MIN = 7`, `longestStraight(path)`, `boardHasLongStraight(map)` as above. No Phaser, no state.
2. Measure the constant: over a fixed batch (1..2000) on **both** 14x8 and 8x14, compute the effective rate — `boardHasLongStraight(generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1, false, false, seed))` — for each candidate `LONG_STRAIGHT_MIN` in {7, 8, 9, …}. Pick the value ~1-in-5 of boards reach (if 7 already gives ~1-in-5, keep 7; otherwise the next longer value that keeps ~1-in-5). Pin it.
3. Find the committed seed S: the smallest free seed (not in {1,2,3,4,5,6,7,8,9,11,13,15}) whose 8x14 board (grown as `boardFactMap`) has `boardHasLongStraight` true. Use a `_tmp_` helper test (model it on `tests/core/_tmp_findseed.test.ts`) to find S, then delete the helper. Pin S.
4. `src/core/boardFacts.ts`: add `'longstraight'` to `BoardFactMark`; add the row to `BOARD_FACTS` (polish `name`/`meaning` to the existing style, tag `{ kind: 'some' }`); add `longstraight: { seed: S }` to `BOARD_FACT_SEEDS`. No `boardFactMap`/`boardFactTag` change (they are generic).
5. `src/debug/runChecks.ts`: add the import (`boardHasLongStraight`, `longestStraight`, `LONG_STRAIGHT_MIN` from `../core/longStraight`) and one line next to the board invariants: `['board.longStraight', (g) => (boardHasLongStraight(g.board.map) && longestStraight(g.board.map.path) < LONG_STRAIGHT_MIN ? `a long-straight board has no straight of ${LONG_STRAIGHT_MIN}` : null)],`
6. `tests/core/boardFacts.test.ts`: the marks array → `['choke','bend','longway','twochokes','switchback','fargate','fork','loop','cove','twin','markedcell','dblmark','longstraight']` (and the "twelve" → "thirteen" wording); add `import { boardHasLongStraight } from '../../src/core/longStraight';` and `case 'longstraight': expect(boardHasLongStraight(m)).toBe(true); break;` to the `facts` switch.
7. Create `tests/core/longStraight.test.ts` (see Tests).
8. `npm run check` (typecheck + lint + unit tests) and `npm run smoke` (the fresh run reaches the Boards reference and closes cleanly; the new invariant runs live).

### Pitfalls

- **`roadStretches` is in `core/cove.ts`, not `core/path.ts`** — import it from `./cove`. (The pre-compaction notes had the file wrong.)
- **Exclusivity is fork/loop only.** C2 says the long straight *coexists* with the cove, the twin, the marked cell, the double mark, the far gate, the slow stretch and the rocks; only the fork and the loop are exclusive. `boardHasLongStraight` is therefore `!map.fork && !map.loop && longestStraight >= MIN`. If a broader exclusivity were intended (e.g. never on a cove/twin board), add `!map.cove && !map.twin` (and `!map.marked` etc.) — but that contradicts C2, so fork/loop only is the reading.
- **The constant and the rate are measured and pinned, not assumed.** The effective rate (`boardHasLongStraight`, fork/loop excluded) must be ~1-in-5 — that is what pins `LONG_STRAIGHT_MIN`. If 7 already gives ~1-in-5, keep 7; otherwise the next longer value. Do not hand-wave the band; pin the batch (1..2000, both orientations) and the band around the measured rate.
- **The committed seed is the smallest free seed, found on the 8x14 portrait** (the orientation `boardFactMap` grows — `GRID.short, GRID.long` = 8, 14), not on 14x8. S must not collide with the other rows' seeds {1..15}.
- **No new mark** (C1): do **not** touch `src/ui/boardFactMarks.ts` (it is dead — no importer — and adding a case there is a new mark). The shape is visible on the board and named in the reference; that is the whole "teach."
- **No `map.ts` change.** The long straight is a property of the grown road, not a placed field — the road generates exactly as today (a no-long-straight board is that seed's exact board, stable across resumes and ghost replays).

### Tests

- `tests/core/longStraight.test.ts` (new; the cove/twin/marked-cell/double-mark tests are untouched):
  - **Rate** (the board facts' test's own pattern): over the pinned batch (1..2000) on both 14x8 and 8x14, the rate of boards that `boardHasLongStraight` is within the pinned ~1-in-5 band, e.g. `expect(rate).toBeGreaterThanOrEqual(0.14); expect(rate).toBeLessThanOrEqual(0.26);` (the numbers pinned after step 2).
  - **Exclusivity:** over 1..1000 on both 14x8 and 8x14, whenever `boardHasLongStraight(map)` then `expect(map.fork).toBeUndefined()` and `expect(map.loop).toBeUndefined()`; and the committed-seed board carries it — `const committed = boardFactMap('longstraight'); expect(boardHasLongStraight(committed)).toBe(true);`
  - **Constant pin:** the committed board visibly runs it — `expect(longestStraight(committed.path)).toBeGreaterThanOrEqual(LONG_STRAIGHT_MIN);` (and, from the rate test, `LONG_STRAIGHT_MIN` is the value ~20% of boards reach).
- `tests/core/boardFacts.test.ts` (modified): thirteen modifiers in order (marks array), each grown board carries its modifier (`case 'longstraight'`), every listed row has a committed seed, each row's board is identical every time it is grown.
- `npm run check` passes (typecheck + lint + unit tests).
- `npm run smoke` — a fresh run reaches the Boards reference (the new longstraight row, grown from S, shown with a visibly long longest straight) and closes cleanly; the `board.longStraight` invariant runs live.

## Attempt 1 failed (asus)

Runner error: git fetch --quiet --prune origin failed (exit 1):
error: cannot lock ref 'refs/remotes/origin/main': is at 23416ff987497f58ad7f06433020d0998d30eec2 but expected 5d1b06536c054899a8ed5939458421d096dfb4c2

- Deleted tests/core/_tmp_ls_probe.test.ts, as the agent asked.
- Deleted tests/core/_ls_probe.txt, as the agent asked.
- Self-review made fixes (kept; checks pass).

```
Error: git fetch --quiet --prune origin failed (exit 1):
error: cannot lock ref 'refs/remotes/origin/main': is at 23416ff987497f58ad7f06433020d0998d30eec2 but expected 5d1b06536c054899a8ed5939458421d096dfb4c2

    at Git.fetch (file:///C:/Users/InetSpark/Documents/Repos/scope-creep/loop/git.ts:134:29)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async integrate (file:///C:/Users/InetSpark/Documents/Repos/scope-creep/loop/dev.ts:260:5)
    at async runDevTask (file:///C:/Users/InetSpark/Documents/Repos/scope-creep/loop/dev.ts:144:21)
    at async main (file:///C:/Users/InetSpark/Documents/Repos/scope-creep/loop/runner.ts:154:9)
```
