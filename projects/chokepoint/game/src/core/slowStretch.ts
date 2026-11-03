import { roadStretches } from './cove';
import type { Cell, GameMap } from './map';

/**
 * The slow stretch (the board's "The slow stretch" trait): three consecutive road cells that every
 * walker walks at 70% of its speed — the board's face gives that stretch of road double value (a
 * tower that covers it takes about 40% more shots at every crossing enemy), and the tint says
 * where it is before the first wave. The decision is the seed's own FNV-1a hash (like the loop's
 * and the twin's) and the placement is a pure function of the grown board (no rng), so a board
 * without the stretch is that seed's exact board, down to the bytes. Unlike the cove and the twin
 * it composes with the fork and the loop: it is a property of road cells, not a shape, so it sits
 * on whatever road the seed grows.
 */

/** The slow stretch: the three consecutive path cells, in walking order. */
export interface SlowStretch { cells: Cell[]; }

/** The walk factor while an enemy's center is on a stretch cell (it multiplies whatever it would walk). */
export const SLOW_STRETCH_FACTOR = 0.7;

/** The seed's own FNV-1a 31-bit hash of `slowstretch:${seed}`: the roll, and the bend's pick on a board with no straight run of three. */
export function slowStretchHash(seed: number): number {
  let h = 2166136261;
  const text = `slowstretch:${seed}`;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/**
 * Whether the board with this seed has a slow stretch, in the twin's pattern — one in four. Its
 * own salt keeps the roll independent of the loop's, the fork's, the cove's and the twin's, so a
 * stretched board can be looped, forked, coved or twined; it never draws on the run's rng, so a
 * board without the stretch is that seed's exact board.
 */
export function boardHasSlowStretch(seed: number): boolean {
  return (slowStretchHash(seed) >>> 2) % 4 === 0;
}

/**
 * Whether the stretch can be covered: a build cell on each side of the road at the stretch's cells
 * (the stretch's own promise). A straight run: both perpendiculars of the run's step at every one
 * of its cells. A bend: the corner's two orthogonal neighbours that are not the run's two cells.
 */
export function stretchCovered(map: GameMap, cells: readonly Cell[]): boolean {
  const open = (c: Cell): boolean =>
    c.col >= 0 && c.col < map.cols && c.row >= 0 && c.row < map.rows && map.kinds[c.row]![c.col] === 'open';
  const a = cells[0]!, b = cells[1]!, c = cells[2]!;
  const dc = b.col - a.col, dr = b.row - a.row;
  if (c.col - b.col === dc && c.row - b.row === dr) {
    // Straight: both sides of the road are open at every cell of the run.
    for (const p of cells) {
      if (!open({ col: p.col - dr, row: p.row + dc })) return false;
      if (!open({ col: p.col + dr, row: p.row - dc })) return false;
    }
    return true;
  }
  // A bend: the corner's two orthogonal neighbours that are not the run's two cells.
  const neighbour = (col: number, row: number): boolean => !(col === a.col && row === a.row) && !(col === c.col && row === c.row);
  return [
    { col: b.col - 1, row: b.row },
    { col: b.col + 1, row: b.row },
    { col: b.col, row: b.row - 1 },
    { col: b.col, row: b.row + 1 },
  ].filter((n) => neighbour(n.col, n.row)).every(open);
}

/**
 * Places the stretch: the middle three cells of the road's longest straight run of three or more
 * (a run of exactly three is taken whole; a tie: the smaller midpoint, the twin's rule). On the
 * rare board with no such run the three cells sit around one bend, the bend chosen by the seed's
 * hash. When the chosen cells have no build cell on a side undefined comes back and the board
 * grows without the stretch — a quality promise, not a road feature. It never moves a cell.
 */
export function placeSlowStretch(map: GameMap, seed: number): GameMap | undefined {
  const path = map.path;
  let best: { n: number; m: number } | undefined;
  for (const s of roadStretches(path)) {
    const n = s.end - s.start + 1;
    if (n < 3) continue;
    const m = s.start + Math.floor((n - 1) / 2); // the run's midpoint cell (the lower middle of an even run)
    if (!best || n > best.n || (n === best.n && m < best.m)) best = { n, m };
  }
  let cells: Cell[] | undefined;
  if (best !== undefined) {
    const m = best.m;
    cells = [path[m - 1]!, path[m]!, path[m + 1]!]; // the middle three (a run of three takes it whole)
  } else {
    // The rare no-straight-three board: the three cells around one bend, the bend the seed's hash picks.
    const bends: number[] = [];
    for (let i = 1; i < path.length - 1; i++) {
      if (path[i]!.col - path[i - 1]!.col !== path[i + 1]!.col - path[i]!.col || path[i]!.row - path[i - 1]!.row !== path[i + 1]!.row - path[i]!.row) bends.push(i);
    }
    if (bends.length > 0) {
      const b = bends[slowStretchHash(seed) % bends.length]!;
      cells = [path[b - 1]!, path[b]!, path[b + 1]!];
    }
  }
  if (cells === undefined || !stretchCovered(map, cells)) return undefined;
  return { ...map, slowStretch: { cells } };
}

/** The union of the stretch's three cells, in board units: an enemy whose center is inside it walks slow. */
export interface StretchBox { minX: number; minY: number; maxX: number; maxY: number; }

export function stretchBox(stretch: SlowStretch, cellSize: number): StretchBox {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const c of stretch.cells) {
    minX = Math.min(minX, c.col * cellSize);
    maxX = Math.max(maxX, (c.col + 1) * cellSize);
    minY = Math.min(minY, c.row * cellSize);
    maxY = Math.max(maxY, (c.row + 1) * cellSize);
  }
  return { minX, minY, maxX, maxY };
}
