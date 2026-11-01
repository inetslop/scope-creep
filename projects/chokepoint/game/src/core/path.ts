import type { Cell, GameMap } from './map';

export interface Point {
  x: number;
  y: number;
}

/**
 * The route enemies walk, as a polyline in board units: from one cell outside the entrance,
 * through the center of every path cell, to one cell outside the exit. Enemies store only how
 * far along it they are (`distance`), so speed changes and "furthest along" targeting are trivial.
 */
export class PathLine {
  readonly points: readonly Point[];
  /** Cumulative distance at each point. */
  private readonly at: number[];
  readonly length: number;

  constructor(points: readonly Point[]) {
    if (points.length < 2) throw new Error('PathLine needs at least 2 points');
    this.points = points;
    this.at = [0];
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1]!;
      const b = points[i]!;
      this.at.push(this.at[i - 1]! + Math.hypot(b.x - a.x, b.y - a.y));
    }
    this.length = this.at[this.at.length - 1]!;
  }

  /** Position at `distance` along the line (clamped to both ends). */
  pointAt(distance: number): Point {
    const d = Math.min(Math.max(distance, 0), this.length);
    let i = 1;
    while (i < this.at.length - 1 && this.at[i]! < d) i++;
    const a = this.points[i - 1]!;
    const b = this.points[i]!;
    const span = this.at[i]! - this.at[i - 1]!;
    const t = span > 0 ? (d - this.at[i - 1]!) / span : 0;
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }
}

/** Center of a cell in board units. */
export function cellCenter(cell: Cell, cellSize: number): Point {
  return { x: (cell.col + 0.5) * cellSize, y: (cell.row + 0.5) * cellSize };
}

/** The walking route of a map: one cell before the entrance, every path cell, one cell past the exit. */
export function pathLineFor(map: GameMap, cellSize: number): PathLine {
  return pathLineForLane(map, cellSize, 0);
}

/**
 * The walking route of a map's lane (core/fork.ts): lane 0 is the road itself; lane 1 splices the
 * fork's lane B between the split cell and the rejoin cell, the same cells before and after. Both
 * lanes walk the same distance and end at the same exit.
 */
export function pathLineForLane(map: GameMap, cellSize: number, lane: 0 | 1): PathLine {
  const path = map.path;
  const cells = lane === 1 && map.fork ? [...path.slice(0, map.fork.split + 1), ...map.fork.laneB, ...path.slice(map.fork.rejoin)] : path;
  const first = cells[0]!;
  const last = cells[cells.length - 1]!;
  const before: Cell = map.vertical ? { col: first.col, row: first.row - 1 } : { col: first.col - 1, row: first.row };
  const after: Cell = map.vertical ? { col: last.col, row: last.row + 1 } : { col: last.col + 1, row: last.row };
  return new PathLine([before, ...cells, after].map((c) => cellCenter(c, cellSize)));
}
