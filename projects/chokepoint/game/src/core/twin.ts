import { roadStretches } from './cove';
import type { Cell, GameMap } from './map';

/**
 * The twin (the board's "The twin" trait): the two build cells at the midpoint of the road's
 * longest straight stretch of three or more cells, one on each side of the road in exact mirror
 * position — the run's most open stretch reads as a clean either/or. The decision is the seed's
 * own FNV-1a hash (like the loop's and the cove's) and the placement is a pure function of the
 * grown board (no rng), so a board without a twin is that seed's exact board, down to the bytes.
 * The cells stay ordinary open cells: nothing is relocated, buffed or painted. Never on a fork
 * or a loop board.
 */

/** The twin: the two mirror build cells at the stretch's midpoint, one on each side of the road. */
export interface Twin { a: Cell; b: Cell; }

/**
 * Whether the board with this seed has a twin: the FNV-1a 31-bit hash of `twins:${seed}`, in the
 * loop's pattern — one in four. The salt ends in a different two-bit state than `loop:`, so the
 * roll never lands on a loop board (a board without the loop's silhouette, the cove's own rule).
 */
export function boardHasTwin(seed: number): boolean {
  let h = 2166136261;
  const text = `twins:${seed}`;
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
