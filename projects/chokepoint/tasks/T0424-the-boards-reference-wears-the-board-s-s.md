---
id: T0424
title: "The boards reference wears the board's shape: a small live board on each row"
assignee: inet-racing
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-02T12:40:16Z
claimed_at: 2026-11-02T13:36:21Z
finished_at: 2026-11-02T14:13:14Z
---

## Goal
The pause's Boards reference (T0350) names every board modifier in words — "the fork · some boards," "the far gate · tech · The door" — but a board's shape is only ever seen in a run. Each row now wears its modifier's board, so a first-time player who draws a fork pauses and sees the fork, not just the word.

## Details
- Each row of the pause's Boards reference — the list of the board's modifiers and where each comes from (always / tech · <node> / some boards) — gains a small board to the left of the row's name line, in the Enemies reference's own pattern (the token at the left of the name): the island, the white road, the gates, the rocks and the build cells in the board's own look, scaled to the row at ~96 px tall.
- One fixed seed per row's modifier, a committed constant (never a roll): the board grown from it exhibits that row's modifier. The fork row shows a fork, the loop row shows the road circling the island once, the cove row shows the bay with its pocket, the far gate row shows the second entrance, the switchback row shows the road folded back on itself, the marked cell row shows the marked cell's own look, and a plain base row (if the reference lists one) shows a plain road. A row's board is the same every time the reference opens, on any profile.
- The thumbnails follow the rows: the row set is unchanged (nothing added or removed), and the row's name and its source words are the reference's own, unchanged. A row whose modifier has no seed constant (a row added later) shows text only, exactly as the reference is today.
- The mini-board shows the shape only: no new mark, name, number or chip painted on it (the board's bar: nothing painted to hint, teach or decorate). The shape is shown nowhere in the reference today (the rows are words only); the boards leaderboard's entries, if they render a board, are scored run records, not modifier examples.
- It fits: the row grows to the board's height in the reference's own row pattern; if the rows no longer fit the card, the card takes the Enemies reference's own pattern (all rows in one card, every row reachable). Every row is reachable on screen at 412x915 and 1280x720 with the longest row name.
- No sound, no new key or button, no change to the pause's controls list. The run is untouched: the seeds are reference-only constants, and board generation, the run's save and the in-run readouts are unchanged.

## Acceptance criteria
- [ ] In the pause's Boards reference, each listed modifier's row shows a small board at the left of the name, and the board exhibits the row's modifier: the fork row shows a fork, the loop row shows the road circling the island once, the cove row shows the bay, the far gate row shows the second entrance.
- [ ] A row's board is identical every time the reference opens (a fixed seed, not a roll), on a fresh profile and an old one.
- [ ] A unit test grows each row's seed's board and asserts the board's facts carry that row's modifier, covering every row the reference lists today.
- [ ] The reference's row set is unchanged (nothing added or removed); a row without a seed constant shows text only, exactly as before; the row's name and source words are the reference's own.
- [ ] The mini-board carries no new mark, label or number; the card fits at 412x915 and 1280x720 with the longest row name, and every row is reachable on screen.
- [ ] The run is unaffected: board generation, the run's save and the in-run readouts are unchanged; a run's board is still rolled from the run's own seed.

## Design (architect, inet-racing)

### Files
- edit `src/core/boardFacts.ts` - add the committed per-row seeds + a pure grower for the reference's boards (imports `generateMap`/`Rng` from `./map`/`./rng`, `GRID`/`ROCKS` from `../config`; no Phaser).
- edit `src/scenes/BoardFactsScene.ts` - the row's left column: a ~96 px tall mini-board (the board's own painted look) replaces the 24 px `paintBoardFactMark` glyph; row height grows to the board; textures cleaned up on shutdown.
- edit `tests/core/boardFacts.test.ts` - grow each row's seed board, assert the board's facts carry the row's modifier, every row listed today.
- create `tests/core/boardFactSeeds.search.test.ts` - temporary one-shot seed search (step 1); deleted in step 3.

### Interfaces
In `src/core/boardFacts.ts` (next to `BOARD_FACTS`):
```ts
export interface BoardFactSeed {
  seed: number;
  extraBends?: number; // the bend row: 1 (the row's tech's own parameter)
  lengthMul?: number;  // the long way row: 2
  chokes?: number;     // the two chokes row: 2
  fold?: boolean;      // the switchback row: true
  farGate?: boolean;   // the far gate row: true
}
/** One fixed seed per row's modifier (never a roll). A row added later without an entry shows text only. */
export const BOARD_FACT_SEEDS: Partial<Record<BoardFactMark, BoardFactSeed>> = { /* 10 lines, one per mark, reference order */ };
/** The row's board, grown the run's own way: bgen 2, the run's rocks, a fixed portrait board (8 cols x 14 rows). */
export function boardFactMap(mark: BoardFactMark): GameMap | undefined;
// body: const s = BOARD_FACT_SEEDS[mark]; if (!s) return undefined;
// return generateMap(new Rng(s.seed), GRID.short, GRID.long, ROCKS, s.extraBends ?? 0, s.lengthMul ?? 1, 2, s.chokes ?? 1, s.fold ?? false, s.farGate ?? false, s.seed);
```
`boardFactMap` must pass `bgen = 2` (chokes guarantee; loop/cove rolls only run at bgen ≥ 2) and the row's seed as the `seed` argument (loop/cove come from the seed's hash).

### Steps
1. **Find the seeds (once).** Write `tests/core/boardFactSeeds.search.test.ts`: one test that loops `seed = 1..400` and `console.log`s the first seed whose grown board (`generateMap(new Rng(seed), GRID.short, GRID.long, ROCKS, <row params>, 2, ..., seed)` — same params as `boardFactMap`) passes the row's fact: twochokes `chokeCells(map).length >= 2` (`ensureChokes` keeps a single fold when there's no room — must verify), switchback `switchbackFold(map)` truthy, fargate `map.farGate` defined (`farGateCell` can fail), longway `map.path.length >` the same seed grown with `lengthMul 1`, fork `map.fork` defined (1/3 roll, `placeFork` can fail), loop `map.loop` defined (1/4), cove `map.cove` defined (1/6). Run `npx vitest run tests/core/boardFactSeeds.search.test.ts`, note the printed numbers, prefer distinct seeds across rows (next seed if two collide). choke/bend/markedcell always pass (bgen 2 / the entrance jog / the cell always exists): give them small fixed seeds, e.g. 1, 2, 3.
2. Add `BoardFactSeed`, `BOARD_FACT_SEEDS` (the found numbers) and `boardFactMap` to `src/core/boardFacts.ts`.
3. Add the tests to `tests/core/boardFacts.test.ts`: every row of `BOARD_FACTS` has a `BOARD_FACT_SEEDS` entry; `boardFactMap(m)` grown twice gives the same `path` (fixed seed, no roll); each row's grown map carries its mark: choke `chokeCells(map).length >= 1`, bend `mapExtraBends(map) === 1`, longway path strictly longer than the same seed at `lengthMul 1`, twochokes `chokeCells(map).length >= 2`, switchback `switchbackFold(map)` truthy, fargate/fork/loop/cove the map fields defined, markedcell `kindAt(map, c.col, c.row) === 'open'` for `markedCell(map, seed)`; default case of the switch throws (an unknown mark fails loudly). Delete the search file. `npm run check` must pass.
4. Edit `BoardFactsScene.build()`: imports `CELL` (`../config`), `BOARD_MARGIN, paintBoardPreview` (`../art/board`), `pathLineFor` (`../core/path`), `markedCell` (`../core/markedCell`), `BOARD_FACT_SEEDS, boardFactMap` (`../core/boardFacts`); drop the `paintBoardFactMark` import. Constants: `PAD = 16, BOARD_W = 58, BOARD_H = 96, GAP = 10, HEADER = 64, BOTTOM = 20, ROW_GAP = 10` (replaces `MARK = 24`); `textW = innerW - BOARD_W - GAP`. In the rows map: `h = s ? Math.max(BOARD_H, name.height + 3 + meaning.height) : name.height + 3 + meaning.height` (a seed-less future row stays text-only at its own height). In the row loop, where the mark's Graphics was: `const map = boardFactMap(row.row.mark); if (map) { paintBoardPreview(this, 'boards:fact:' + row.row.mark, map, pathLineFor(map, CELL), markedCell(map, s.seed)); const img = this.add.image(left + BOARD_W / 2, rowTop + row.h / 2, key).setScale(Math.min(BOARD_W / (map.cols * CELL + BOARD_MARGIN * 2), BOARD_H / (map.rows * CELL + BOARD_MARGIN * 2))); parts.push(img); }` (plain `setScale` — painted at 1 px, like PickScene's preview; never `artScale`). Name/tag/meaning x/y unchanged (tag still at `left + innerW`). In `create()`: `this.events.once('shutdown', () => { for (const r of BOARD_FACTS) this.textures.remove('boards:fact:' + r.mark); });`
5. `npm run check && npm run smoke`.

### Pitfalls
- The marked cell's yellow dot is part of the board's own look (`drawBoard` always paints it) — keep it; the marked cell row is the row that shows it. Paint nothing extra on the mini-board.
- `fold` rows: `fold` disables the loop roll in `generateMap` — irrelevant for the switchback row, but never search fork/loop/cove with another row's params.
- Never grow the reference board from `run.rng` or a roll: only `new Rng(seed)` with the committed seed; the run's board generation, save and readouts are untouched (read-only core addition).
- Landscape 14x8 boards would eat the row (158 px wide, 140 px of text left); portrait 8x14 keeps the token column narrow (58 px) and the card at its existing 340 px width. All rows end at 96 px tall (longest meaning wraps to 2 lines in 240 px), card 1134 px; the existing scale-to-fit `layout()` makes every row reachable at 412x915 (scale 0.79) and 1280x720 (scale 0.61) — no scroll code.
- Don't keep the 24 px mark alongside the board (same information, two columns) — but leave `src/ui/boardFactMarks.ts` in place (deleting it is out of this task's scope); just stop importing it.
- No Phaser in `core/boardFacts.ts` (lint enforced); one item per line in `BOARD_FACT_SEEDS`; no new invariant (no run behavior), no sound, no keys.

### Tests
- `tests/core/boardFacts.test.ts`: the three describes from step 3 (seeds exist for every current row; determinism; the grown board carries the row's modifier, all 10 rows). The existing row-order test already guards "row set unchanged".

## Result (attempt 1, inet-racing)

The pause's Boards reference now shows each modifier's own board instead of a small glyph: every row wears a ~96 px mini-board (island, road, gates, rocks, marked cell) grown from a committed per-row seed in `BOARD_FACT_SEEDS` / `boardFactMap` (core/boardFacts.ts, no Phaser), so the fork row shows a fork, the loop row a circling road, the cove row a bay, and the far gate row a second entrance. BoardFactsScene paints each row's board with `paintBoardPreview`, grows the row to the board's height (text-only fallback for a future seed-less row), and cleans the textures up on shutdown; unit tests pin the seeds (determinism + every row's board carries its modifier). The run is untouched — board generation, saves and readouts still roll from the run's own seed.

- Self-review: APPROVE
- Time: 36.9 min
- Deleted tests/core/boardFactSeeds.search.test.ts, as the agent asked.
- Self-review made fixes (kept; checks pass).

```
projects/chokepoint/game/src/core/boardFacts.ts    | 34 +++++++++++++
 .../chokepoint/game/src/scenes/BoardFactsScene.ts  | 44 +++++++++++------
 .../chokepoint/game/tests/core/boardFacts.test.ts  | 56 +++++++++++++++++++++-
 3 files changed, 119 insertions(+), 15 deletions(-)
```
