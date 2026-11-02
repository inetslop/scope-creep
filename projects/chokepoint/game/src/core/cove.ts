import { CHOKES_RANGE } from './choke';
import type { Cell, GameMap } from './map';

/**
 * The cove (the board's "The cove" trait): a bay scooped into the island's edge beside a road curve — the road stays,
 * the edge dips in, and a pocket of three build cells in the edge lane faces the curve, at least two of them reaching
 * two or more straight stretches of the road at once (the choke's own term). The decision is the seed's own FNV-1a
 * hash (like the loop's) and the placement is a pure function of the grown board (no rng), so a board without a
 * cove is today's exact board, down to the bytes. Never on a fork or a loop board.
 */

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
