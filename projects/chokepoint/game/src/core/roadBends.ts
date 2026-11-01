import type { Cell } from './map';

/** How many times a road turns: the cells where its direction changes (the pick step's board facts). */
export function roadBends(path: readonly Cell[]): number {
  let bends = 0;
  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1]!;
    const here = path[i]!;
    const next = path[i + 1]!;
    if (here.col - prev.col !== next.col - here.col || here.row - prev.row !== next.row - here.row) bends += 1;
  }
  return bends;
}
