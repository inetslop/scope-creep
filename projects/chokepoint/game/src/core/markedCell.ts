import { kindAt, type Cell, type GameMap } from './map';
import { Rng } from './rng';

/** A tower built on the board's one marked cell deals this much more damage (1 + 25%). */
export const MARKED_DMG_MUL = 1.25;

/**
 * The board's one marked cell: one of its 'open' build cells, picked from the board's own seed
 * (a fresh Rng, never the run's, so no other seeded draw of the run moves), so the same seed
 * regrows the same board and the same cell (a resumed run re-derives it).
 */
export function markedCell(map: GameMap, seed: number): Cell {
  const opens: Cell[] = [];
  for (let row = 0; row < map.rows; row++) {
    for (let col = 0; col < map.cols; col++) {
      if (kindAt(map, col, row) === 'open') opens.push({ col, row });
    }
  }
  return opens[new Rng(seed).int(0, opens.length - 1)]!;
}

/**
 * Whether the board with this seed has a double mark: the FNV-1a 31-bit hash of `dblmark:${seed}`,
 * in the twin's pattern — one in four.
 */
export function boardHasDoubleMark(seed: number): boolean {
  let h = 2166136261;
  const text = `dblmark:${seed}`;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) % 4 === 0;
}

/**
 * The board's marked cells: always its one first mark, and — on the ~1 in 4 double-mark boards —
 * a second open build cell, the same mark and the same buff, a different cell from the first.
 * Both are derived from the board's own seed the way `markedCell` is (a fresh Rng, never the
 * run's), so the same seed regrows the same cells and a resumed run re-derives them.
 */
export function markedCells(map: GameMap, seed: number): Cell[] {
  const first = markedCell(map, seed);
  if (!boardHasDoubleMark(seed)) return [first];
  const opens: Cell[] = [];
  for (let row = 0; row < map.rows; row++) {
    for (let col = 0; col < map.cols; col++) {
      if (kindAt(map, col, row) === 'open') opens.push({ col, row });
    }
  }
  const i = new Rng(seed).int(0, opens.length - 1);
  return [first, opens[(i + 1) % opens.length]!];
}
