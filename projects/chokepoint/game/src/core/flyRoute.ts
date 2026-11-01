import type { GameMap } from './map';
import { cellCenter, PathLine, type Point } from './path';
import type { Rng } from './rng';

/** One Flyer's crossing: where it lifts off on the entrance edge, where it lands, and its whole path in between. */
export interface FlyLine {
  spawn: Point; // on the entrance edge, board units
  exit: Point;  // the road's own end: one cell past the exit, as pathLineFor
  line: PathLine; // the two-point flight
}

/** The road's own end in board units: the center of the cell one past the exit (the same rule pathLineFor walks to). */
export function exitPoint(map: GameMap, cellSize: number): Point {
  const last = map.path[map.path.length - 1]!;
  const after = map.vertical ? { col: last.col, row: last.row + 1 } : { col: last.col + 1, row: last.row };
  return cellCenter(after, cellSize);
}

/**
 * What fraction of a straight line from `a` to `b` runs over 'open' build cells: quarter-cell
 * samples along it, 0-1. A crossing that follows the road is not a crossing, so the spawn point
 * is redrawn while this stays under the line's threshold (pickFlyLine).
 */
export function openFraction(map: GameMap, cellSize: number, a: Point, b: Point): number {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const n = Math.max(1, Math.ceil(len / (cellSize / 4)));
  let open = 0;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    if (map.kinds[Math.floor(y / cellSize)]?.[Math.floor(x / cellSize)] === 'open') open++;
  }
  return open / (n + 1);
}

/**
 * The seed's crossing for one Flyer: a point on the entrance edge, and the straight line from
 * it to the exit. The point is redrawn from `rng` while the line would follow the road
 * (openFraction under 0.2), at most 24 times, then accepted. Pure: the same seed and board
 * draw the same crossing.
 */
export function pickFlyLine(map: GameMap, rng: Rng, cellSize: number): FlyLine {
  const exit = exitPoint(map, cellSize);
  const edge = (): Point =>
    map.vertical
      ? { x: rng.range(0.5, map.cols - 0.5) * cellSize, y: 0 }
      : { x: 0, y: rng.range(0.5, map.rows - 0.5) * cellSize };
  let spawn = edge();
  for (let tries = 0; tries < 24 && openFraction(map, cellSize, spawn, exit) < 0.2; tries++) spawn = edge();
  return { spawn, exit, line: new PathLine([spawn, exit]) };
}
