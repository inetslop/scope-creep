---
id: T0409
title: "The cove: a bay in the island's edge"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-02T06:19:02Z
---

## Goal
About one board in six carries a cove: a bay scooped into the island's edge beside a road curve, with a pocket of build cells that covers the curve from both sides at once — a new silhouette and a new visible double-cover position, with nothing painted on it.

## Details
- The cove is a natural board fact, in the fork's and the loop's own class: about one board in six carries it.
- What the player sees: the island's edge dips in — a pocket of the light ground between the rocks, a shallow bay opening onto a curve of the road. Three build cells sit in the pocket, facing the curve. The road itself is unchanged: the cove reshapes the island's edge, not the road (the loop reshapes the road; the cove reshapes the island).
- Why it changes placement: the pocket's cells reach the curve from two sides at once — at least two of the three pocket cells are double-cover cells (two or more straight stretches of the road in range, the choke's own term). The island's own shape suggests the position; the player confirms it with the range ring while placing, as with every cell. Nothing is painted on the cells or the island (the board's bar).
- Coexistence: never on a fork or a loop board — their silhouettes already own the read. Free to coexist with the marked cell, the far gate, the choke and the switchback.
- The facts and the reference name it: the board facts and the boards reference add the cove as a "some boards" fact, in the fork's own line style. No other new words, readout or mark anywhere.
- The board code carries it: the same seed regenerates the same cove (the board code's round-trip rule, the fork's own).
- If a board cannot place the cove's guarantee (the double-cover pocket), it falls back to the plain board — the frequency stays approximate, and a board without the cove is byte-identical to today.
- No new sound, no HUD change, no permanent mark: the shape and the two existing fact displays are the whole task.

## Acceptance criteria
- [ ] Over a sample of at least 1000 generated boards, between one in ten and one in four carries the cove (the target is one in six); none of them is a fork or a loop board.
- [ ] On a cove board, three build cells sit in the pocket and at least two of them each reach two or more straight stretches of the road (a tower built on one covers both sides of the curve).
- [ ] The board facts and the boards reference name the cove as a "some boards" fact; the same seed regenerates the same cove.
- [ ] Boards without the cove are byte-identical to before the change: same road, rocks, cells, choke, marked cell and gates.
- [ ] No mark, label or readout is painted on the board or the HUD; `npm run check` and the desktop + mobile smoke pass.

## Design (architect, desktop)

### Files
- create `src/core/cove.ts` - the cove: seed-hash decision, pure placement, stretch counting
- create `tests/core/cove.test.ts` - frequency, pocket shape, round-trip, determinism
- edit `src/core/map.ts` - `cove?` on `GameMap`; one cove step at the end of `generateMap`
- edit `src/core/boardFacts.ts` - `'cove'` mark + one BOARD_FACTS row
- edit `src/ui/boardFactMarks.ts` - one `case 'cove'` in `paintBoardFactMark`
- edit `src/art/board.ts` - `islePath()` with the bay; draw it when `map.cove`
- edit `src/debug/runChecks.ts` - one `board.cove` invariant after `board.loop`
- edit `tests/core/boardFacts.test.ts` - mark list gains `'cove'`, tag check for index 8

### Interfaces
`src/core/cove.ts` (whole file):
```ts
import { CHOKES_RANGE } from './choke';
import type { Cell, GameMap } from './map';

/** The cove (the board's "The cove" trait): a bay scooped into the island's edge beside a road curve — the road stays,
 * the edge dips in, and a pocket of three build cells in the edge lane faces the curve, at least two of them reaching
 * two or more straight stretches of the road at once (the choke's own term). The decision is the seed's own FNV-1a
 * hash (like the loop's) and the placement is a pure function of the grown board (no rng), so a board without a
 * cove is today's exact board, down to the bytes. Never on a fork or a loop board. */

/** The cove: the pocket's three build cells, in the edge lane, from the cell before the curve's turn to the cell after it. */
export interface Cove { cells: Cell[]; }

/** Whether the board with this seed has a cove: the FNV-1a 31-bit hash of `cove:${seed}`, in the loop's pattern — one in six. */
export function boardHasCove(seed: number): boolean {
  let h = 2166136261;
  const text = `cove:${seed}`;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) % 6 === 0;
}

/** The road's maximal straight stretches: the cell ranges between two changes of step direction (shared ends), like the switchback's runs. */
export function roadStretches(path: readonly Cell[]): { start: number; end: number }[] {
  const out: { start: number; end: number }[] = [];
  let start = 0;
  for (let i = 2; i < path.length; i++) {
    if (path[i - 1]!.col - path[i - 2]!.col !== path[i]!.col - path[i - 1]!.col || path[i - 1]!.row - path[i - 2]!.row !== path[i]!.row - path[i - 1]!.row) { out.push({ start, end: i - 1 }); start = i - 1; }
  }
  out.push({ start, end: path.length - 1 });
  return out;
}

/** How many straight stretches of the road have a cell within CHOKES_RANGE of `c` — two or more is double cover (the choke's own term). */
export function stretchesReached(map: GameMap, c: Cell): number {
  let n = 0;
  for (const s of roadStretches(map.path)) {
    for (let i = s.start; i <= s.end; i++) {
      const p = map.path[i]!;
      if (Math.hypot(p.col - c.col, p.row - c.row) <= CHOKES_RANGE) { n++; break; }
    }
  }
  return n;
}

/**
 * Inserts the cove: where the road runs on the edge's own lane (lane 1 or lane width - 2), the
 * turns of that run are curves facing the edge; the pocket is the edge lane's three cells at the
 * turn row. The candidate is walked deterministically (middle of the road first, then the edge,
 * then the row) with the double-cover guarantee checked, so a given board coves the same way
 * every time. When no candidate fits undefined comes back and the map stays as grown.
 */
export function placeCove(map: GameMap): GameMap | undefined {
  const A = (c: Cell) => (map.vertical ? c.row : c.col); // along
  const B = (c: Cell) => (map.vertical ? c.col : c.row); // across
  const cell = (a: number, b: number): Cell => (map.vertical ? { col: b, row: a } : { col: a, row: b });
  const key = (c: Cell) => `${c.col},${c.row}`;
  const length = map.vertical ? map.rows : map.cols;
  const width = map.vertical ? map.cols : map.rows;
  const alongRuns = roadStretches(map.path).filter((s) => s.end > s.start && B(map.path[s.start]!) === B(map.path[s.end]!));
  interface Cand { edge: number; r: number }
  const cands: Cand[] = [];
  for (const edge of [0, width - 1]) {
    const lane = edge === 0 ? 1 : width - 2;
    for (const s of alongRuns) {
      if (B(map.path[s.start]!) !== lane) continue;
      const a0 = A(map.path[s.start]!), a1 = A(map.path[s.end]!);
      if (a0 >= 1) cands.push({ edge, r: a0 }); // the turn into the run (mid runs: the entrance run's a0 is 0)
      if (a1 < length - 1) cands.push({ edge, r: a1 }); // the turn away at the run's far end (the exit run ends on the edge)
    }
  }
  const mid = (length - 1) / 2;
  cands.sort((p, q) => Math.abs(p.r - mid) - Math.abs(q.r - mid) || p.edge - q.edge || p.r - q.r);
  for (const { edge, r } of cands) {
    const pocket = [r - 1, r, r + 1].map((a) => cell(a, edge));
    if (pocket.some((c) => map.kinds[c.row]![c.col] === 'path')) continue; // the edge lane is never road
    if (pocket.filter((c) => stretchesReached(map, c) >= 2).length < 2) continue; // the double-cover guarantee
    // A rock in the pocket is relocated to another open cell, so the three cells stay buildable (the fork's own move).
    const kinds = map.kinds.map((row) => [...row]);
    const protectedKeys = new Set(pocket.map(key));
    for (const c of pocket) {
      if (kinds[c.row]![c.col] !== 'rock') continue;
      kinds[c.row]![c.col] = 'open';
      let placed = false;
      for (let row = 0; row < map.rows && !placed; row++) {
        for (let col = 0; col < map.cols && !placed; col++) {
          if (kinds[row]![col] !== 'open' || protectedKeys.has(`${col},${row}`)) continue;
          kinds[row]![col] = 'rock';
          placed = true;
        }
      }
      // If no home is found the rock is simply dropped (practically unreachable on a real board).
    }
    return { ...map, kinds, cove: { cells: pocket } };
  }
  return undefined;
}
```
`map.ts`: after `import { ensureChokes } from './choke';` add `import { boardHasCove, placeCove, type Cove } from './cove';`. In `GameMap`, after `loop?: Loop;` add: `/** The cove (core/cove.ts): a bay scooped into the island's edge beside a road curve, a pocket of three build cells facing it, on about one board in six (never with the fork or the loop). */\n  cove?: Cove;`. Replace the last line `return { ...(looped ?? forked ?? result), farGate: gate };` with:
```ts
  // The cove (core/cove.ts): one board in six (the seed's own hash, never the rng) scoops a bay into the
  // island's edge beside a road curve — the road stays, the edge dips in; the placement is rng-free, so a
  // board without it is today's exact board. It never shares a board with the fork's or the loop's silhouette.
  const base = looped ?? forked ?? result;
  const coved = seed === undefined || bgen < 2 || looped !== undefined || forked !== undefined ? undefined : boardHasCove(seed) ? placeCove(base) : undefined;
  return { ...(coved ?? base), farGate: gate };
```
`boardFacts.ts` line 12: add `| 'cove'` after `'loop'`. After the `loop` row add one line:
`  { mark: 'cove', name: 'The cove', meaning: 'a bay in the island's edge beside a curve; the pocket's cells cover it from both sides', tag: { kind: 'some' } },`
`boardFactMarks.ts`, after the `case 'loop':` block add:
```ts
    case 'cove': // the edge dips in beside the road's curve, a cell in the bay
      road(g, -9, -9, -9, -3);
      road(g, -9, 3, -9, 9);
      g.fillRoundedRect(-7, -1.5, 3, 3, 1);
      road(g, -3, -9, -3, 2);
      road(g, -3, 2, 8, 2);
      break;
```
`art/board.ts`: add `traceRounded` to the `./paint` import and `import type { Cove } from '../core/cove';`. In `drawBoard`, replace `roundRectPath(ctx, 0, 0, w, h, CELL * 0.32);` (the island line only) with `if (map.cove) islePath(ctx, map, map.cove); else roundRectPath(ctx, 0, 0, w, h, CELL * 0.32);`. Add this private function:
```ts
/** The island's outline: the rounded rectangle, with the cove's bay scooped into the edge lane of its pocket. */
function islePath(ctx: CanvasRenderingContext2D, map: GameMap, cove: Cove): void {
  const R = CELL * 0.32; // the island's corner radius, as the plain board's
  const D = CELL * 0.45; // the bay's depth: the pocket's three cells keep their centers on the island
  const w = map.cols * CELL, h = map.rows * CELL;
  const c0 = cove.cells[0]!, c2 = cove.cells[2]!;
  let pts: { x: number; y: number }[];
  if (c0.row === 0 && c2.row === 0) {
    const x0 = c0.col * CELL, x1 = (c2.col + 1) * CELL;
    pts = [{ x: 0, y: 0 }, { x: x0, y: 0 }, { x: x0, y: D }, { x: x1, y: D }, { x: x1, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }];
  } else if (c0.row === map.rows - 1 && c2.row === map.rows - 1) {
    const x0 = c0.col * CELL, x1 = (c2.col + 1) * CELL;
    pts = [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: x1, y: h }, { x: x1, y: h - D }, { x: x0, y: h - D }, { x: x0, y: h }, { x: 0, y: h }];
  } else if (c0.col === 0 && c2.col === 0) {
    const y0 = c0.row * CELL, y1 = (c2.row + 1) * CELL;
    pts = [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }, { x: 0, y: y1 }, { x: D, y: y1 }, { x: D, y: y0 }, { x: 0, y: y0 }];
  } else if (c0.col === map.cols - 1 && c2.col === map.cols - 1) {
    const y0 = c0.row * CELL, y1 = (c2.row + 1) * CELL;
    pts = [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: y1 }, { x: w - D, y: y1 }, { x: w - D, y: y0 }, { x: w, y: y0 }, { x: w, y: h }, { x: 0, y: h }];
  } else { roundRectPath(ctx, 0, 0, w, h, R); return; }
  // The bay may touch the island's corner: drop duplicated points, or the trace divides by zero.
  const out = pts.filter((p, i) => i === 0 || p.x !== pts[i - 1]!.x || p.y !== pts[i - 1]!.y);
  if (out.length > 1 && out[out.length - 1]!.x === out[0]!.x && out[out.length - 1]!.y === out[0]!.y) out.pop();
  traceRounded(ctx, out, R);
}
```
`runChecks.ts`, after the `['board.loop', ...]` entry add:
```ts
  ['board.cove', (g) => {
    const cove = g.board.map.cove;
    if (!cove) return null;
    if (g.board.map.fork || g.board.map.loop) return 'a cove shares the board with the fork or the loop';
    if (cove.cells.length !== 3) return `the cove's pocket has ${cove.cells.length} cells, expected 3`;
    for (const c of cove.cells) if (g.board.map.kinds[c.row]![c.col] !== 'open') return `a cove pocket cell is not buildable at (${c.col}, ${c.row})`;
    return null;
  }],
```

### Steps
1. Create `src/core/cove.ts` exactly as above.
2. Wire `map.ts` (import, `cove?` field, the cove step, and add one sentence to `generateMap`'s doc block: "One board in six also carries the cove (core/cove.ts): a bay in the island's edge beside a road curve, the road unchanged; never on a loop or fork board, and rng-free like the loop, so a board without it is that seed's exact board.").
3. Add the fact row + mark (`boardFacts.ts`, `boardFactMarks.ts`).
4. Paint the bay (`art/board.ts`).
5. Add the invariant (`runChecks.ts`).
6. Create `tests/core/cove.test.ts`: copy the fork test's `expectValidPath`; an `expectCoveShape(map)` that checks (a) three cells, all `'open'`, all in one edge lane (`B === 0` or `B === width-1`), consecutive in `A`; (b) the corner: `kindAt(mid) === 'path'` where mid is the cell in lane `1`/`width-2` at the middle pocket cell's `A`, and the path's direction changes at that index; (c) `cells.filter((c) => stretchesReached(map, c) >= 2).length >= 2`. Tests: (i) for seeds 1..1000 and both `[14,8]` and `[8,14]`: `expectValidPath`, `expect(map).toEqual(generateMap(new Rng(seed), cols, rows, 5))` (round-trip), and on cove boards `map.fork`/`map.loop` undefined + `expectCoveShape`; the coved/2000 ratio is `>= 0.1` and `<= 0.25`. (ii) `boardHasCove` over seeds 1..6000 lands between 850 and 1250. (iii) `placeCove(grown)` equals itself for 50 seeds. (iv) for seeds with `boardHasCove` false (200 seeds, both orientations) `generateMap(...).cove` is `undefined`.
7. Update `tests/core/boardFacts.test.ts`: the marks list gains `'cove'` after `'loop'`, the "nine modifiers" title becomes "ten modifiers", and add `expect(boardFactTag(BOARD_FACTS[8]!, [])).toBe('some boards');`.
8. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Never draw on the run's rng in `boardHasCove`/`placeCove` — a stray `rng.chance` would shift every later seeded roll (waves, lanes) and break byte-identity. The loop's hash pattern is the only decision; placement is pure.
- The cove is excluded only on fork/loop boards (and without a seed / `bgen < 2`, like the loop) — it must NOT be excluded on a switchback (`fold`) board.
- `traceRounded` divides by segment length: the duplicate-point filters (consecutive AND wrap-around) in `islePath` are mandatory, not cleanup — the bay can touch the island's corner when the pocket starts or ends at row/col 0.
- Rock relocation must skip all three pocket cells (`protectedKeys`) or a relocated rock can land in its own pocket; the row-major scan mirrors the fork/loop move exactly (a cleared cell is `'open'` again and can receive a later rock — that is the existing behavior).
- Orientation: use the `A`/`B`/`cell` mapping for every coordinate; the pocket is in the edge lane in across-space (row 0/`width-1` on landscape = top/bottom edges, col 0/`cols-1` on portrait = left/right edges).
- Do not add a new `CellKind`, paint anything on the pocket cells, or change the pick/HUD scenes — the bay (silhouette) and the two existing fact displays are the whole feature. `BoardFactsScene` picks up the new row automatically (its height is content-measured).
- If the frequency test lands under 1/10, the candidate walk is too narrow — check that mid-run turns at BOTH ends are candidates; do not loosen the test band.

### Tests
- `tests/core/cove.test.ts` (new, as specified above) and the two-line update to `tests/core/boardFacts.test.ts`; nothing else — the rest is data-free core logic already covered.
