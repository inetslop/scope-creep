---
id: T0430
title: "The twin: the board's mirror pair of build cells"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-02T15:49:41Z
---

## Goal
About a quarter of boards carry a guaranteed mirror pair of build cells, so the run's most open stretch offers a clean either/or placement choice instead of a scatter of cells — the first big decision reads as a decision (Pillar 1) on those boards.

## Details
- About one board in four (a seed-hash decision, exclusive with the fork and the loop — the cove's own exclusivity) carries "The twin": the generator finds the road's longest straight stretch (three or more road-cells) that has buildable room on both sides, and makes the two cells at the stretch's midpoint — one on each side, the same distance from the road — buildable in exact mirror position. If no such stretch has room on both sides, the board simply does not carry the twin.
- What the player sees: two build cells facing each other across the road at its widest straight — a clean "pick one (or build both)" at the most open part of the map. Nothing is painted on or beside them (the board bar: no hint, teach or decoration marks); they read as ordinary cells in mirror positions, and the range ring while placing shows what each reaches.
- The two cells are ordinary build cells: no buff, no cost change. The marked cell and the guaranteed choke are untouched and may sit anywhere, including (rarely) on a twin cell.
- The board's fact line (boardFacts) and the pause's Boards reference (T0350) name it when present — "The twin — a mirror pair of cells on the longest straight" — and stay silent otherwise.

## Acceptance criteria
- [ ] Roughly one new board in four carries The twin: two build cells at equal road-distance on opposite sides of the road, at the midpoint of a straight stretch of three or more cells; boards carrying the fork or the loop never carry it.
- [ ] When present, the board's fact line and the Boards reference name The twin; when absent, neither mentions it.
- [ ] No hint, mark or decoration is painted on or beside the twin cells — they read as ordinary build cells in mirror positions.
- [ ] The twin's cells are ordinary (no buff, no cost change), and a board that does not carry The twin is byte-identical to before this change.

## Design (architect, desktop)

### Files
- create `src/core/twin.ts` - the twin: seed-hash decision + pure placement (full code in Interfaces)
- edit `src/core/map.ts` - import twin, add `GameMap.twin` field, one block in `generateMap` (after the cove, replacing its return), one doc-comment sentence
- edit `src/core/boardFacts.ts` - `'twin'` in the `BoardFactMark` union (after `'cove'`), one row in `BOARD_FACTS` (after the cove row), one seed in `BOARD_FACT_SEEDS`
- edit `src/ui/boardFactMarks.ts` - one `case 'twin':` in the switch (after the cove case)
- edit `src/debug/runChecks.ts` - one `board.twin` invariant (after the `board.cove` entry)
- create `tests/core/twin.test.ts` - unit tests (model on `tests/core/cove.test.ts`)
- edit `tests/core/boardFacts.test.ts` - expected mark list gains `'twin'` after `'cove'` (title: eleven), `facts()` switch gains `case 'twin': expect(m.twin).toBeDefined(); break;`
- edit `tests/core/cove.test.ts` - line 73 guard becomes `if (!map.loop && !map.twin)`
- edit `tests/core/loop.test.ts` - line 151 guard becomes `if (!map.cove && !map.twin)`

### Interfaces
`src/core/twin.ts` (write exactly this; `roadStretches` is already exported by `core/cove.ts`):
```ts
import { roadStretches } from './cove';
import type { Cell, GameMap } from './map';

export interface Twin { a: Cell; b: Cell; }

export function boardHasTwin(seed: number): boolean {
  let h = 2166136261;
  const text = `twin:${seed}`;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) % 4 === 0;
}

export function placeTwin(map: GameMap): GameMap | undefined {
  const path = map.path;
  let best: { n: number; i: number; a: Cell; b: Cell } | undefined;
  for (const s of roadStretches(path)) {
    const n = s.end - s.start + 1; // the stretch's cell count
    if (n < 3) continue;
    const m = s.start + Math.floor((n - 1) / 2); // midpoint cell (the lower middle of an even stretch)
    const p = path[m]!;
    const dx = path[m + 1]!.col - p.col; // the stretch's step: (±1, 0) or (0, ±1)
    const dy = path[m + 1]!.row - p.row;
    const a = { col: p.col - dy, row: p.row + dx }; // one side
    const b = { col: p.col + dy, row: p.row - dx }; // the mirror side
    if (a.col < 0 || a.col >= map.cols || a.row < 0 || a.row >= map.rows) continue;
    if (b.col < 0 || b.col >= map.cols || b.row < 0 || b.row >= map.rows) continue;
    if (map.kinds[a.row]![a.col] !== 'open' || map.kinds[b.row]![b.col] !== 'open') continue;
    if (!best || n > best.n || (n === best.n && m < best.i)) best = { n, i: m, a, b };
  }
  return best ? { ...map, twin: { a: best.a, b: best.b } } : undefined;
}
```
`GameMap` gains `twin?: Twin;` (after `cove?: Cove;`). In `generateMap`, replace `return { ...(coved ?? base), farGate: gate };` with:
```ts
  const final = coved ?? base;
  const twinned = seed === undefined || bgen < 2 || looped !== undefined || forked !== undefined ? final : boardHasTwin(seed) ? (placeTwin(final) ?? final) : final;
  return { ...twinned, farGate: gate };
```
Fact row (after the cove row): `{ mark: 'twin', name: 'The twin', meaning: 'a mirror pair of cells on the longest straight', tag: { kind: 'some' } },` and `twin: { seed: S },` in `BOARD_FACT_SEEDS`. Mark case (after the cove case in `paintBoardFactMark`):
```ts
    case 'twin': // the road's straight, a cell on each side in mirror position
      road(g, 0, -10, 0, 10);
      g.fillRoundedRect(-9, -3, 6, 6, 2);
      g.fillRoundedRect(3, -3, 6, 6, 2);
      break;
```
Invariant (after the `board.cove` entry in `INVARIANTS`): `['board.twin', (g) => { const twin = g.board.map.twin; if (!twin) return null; if (g.board.map.fork || g.board.map.loop) return 'a twin shares the board with the fork or the loop'; for (const c of [twin.a, twin.b]) if (g.board.map.kinds[c.row]![c.col] !== 'open') return `a twin cell is not buildable at (${c.col}, ${c.row})`; const mid = { col: (twin.a.col + twin.b.col) / 2, row: (twin.a.row + twin.b.row) / 2 }; if (g.board.map.kinds[mid.row]![mid.col] !== 'path') return `the twin's midpoint is not road`; return null; }],`

### Steps
1. Write `src/core/twin.ts` exactly as above.
2. Edit `src/core/map.ts`: import `{ boardHasTwin, placeTwin, type Twin }` from `'./twin'` next to the cove import; add the field + doc line; the `generateMap` block; one sentence in the big doc comment: "One board in four also carries the twin (core/twin.ts): the two cells at the midpoint of the road's longest straight stretch, one on each side in mirror position — metadata only, never on a loop or fork board, and rng-free like the loop."
3. Write `tests/core/twin.test.ts` (model cove.test.ts): (a) 1000 seeds × both orientations through `generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1, false, false, seed)` — twin boards never carry fork/loop and pass a shape check (both cells `open`, Manhattan 2 apart, midpoint `path`, the midpoint cell sits mid a straight stretch of ≥ 3 cells); expect the twinned fraction of 2000 in [0.06, 0.22]; (b) `boardHasTwin` over 4000 seeds in [850, 1150]; (c) `placeTwin(grown)` deterministic over 50 seeds; (d) 200 no-hash seeds per orientation have `twin` undefined; (e) two hand-built `GameMap` literals (`{ cols, rows, kinds, path, vertical }`, kinds 'open' except the path and rocks): path `[(0,1),(1,1),(2,1),(3,1),(4,1),(4,0),(5,0)]` 6×6 with a rock at (2,0) → `placeTwin` undefined (the only ≥ 3 stretch has no room); path `[(0,2),(1,2),(2,2),(3,2),(3,1),(4,1),(5,1)]` 6×6 with a rock at (1,1) → the twin is the set {(4,0),(4,2)} (the longer blocked stretch is skipped, the longest stretch with room wins).
4. Find `S`: put `twin: { seed: 10 }` and run the boardFacts tests; while "each row's grown board carries the row's modifier" fails for the twin row, bump `S` (11, 12, 14, 15, … — 1–9 and 13 are taken). The row's board is `boardFactMap('twin')`: 8×14 portrait, ROCKS, bgen 2.
5. Add the fact row, union member, mark case, invariant, and the three test edits above.
6. `npm run check` — all green.

### Pitfalls
- Never draw on `run.rng` for the twin (hash + pure function) — any draw would shift the fork's roll and every wave and break saves; the guard must mirror the cove's exactly (`seed === undefined || bgen < 2` included — gen-1 and ghost boards never twin).
- Never touch `kinds`: unlike the cove, the twin relocates no rocks — a stretch whose midpoint side is a rock is simply skipped. That is what keeps the twin's cells ordinary and twin-less boards byte-identical (the `twin` field is absent whenever placement doesn't happen).
- The exclusivity guard is `looped !== undefined || forked !== undefined` (the cove's own rule) — never read it off `base`.
- The `&& !map.twin` guards in the cove/loop tests are required: seeded-vs-unseeded `toEqual` fails the moment a twin board has an extra field the unseeded call lacks.
- `BoardFactsScene` is untouched — the new row is data; the card grows one row (height 96, BOARD_H-bound) and scales to fit, as it always does. No painting anywhere: the twin cells are ordinary open cells in `art/board.ts`, previews and run alike.

### Tests
- `tests/core/twin.test.ts` as specified in Step 3 (shape, frequency, hash rate, determinism, no-hash, two hand-built placement cases).
- `tests/core/boardFacts.test.ts`: updated order + the twin row's committed seed verified by the existing "carries the row's modifier" test.
