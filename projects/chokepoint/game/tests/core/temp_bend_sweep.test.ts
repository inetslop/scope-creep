import { describe, expect, it } from 'vitest';
import { generateMap, mapExtraBends, kindAt, type GameMap } from '../../src/core/map';
import { Rng } from '../../src/core/rng';

function countBends(map: GameMap): number {
  const p = map.path;
  let bends = 0;
  for (let i = 1; i < p.length - 1; i++) {
    const a = p[i - 1]!;
    const b = p[i]!;
    const c = p[i + 1]!;
    if (Math.sign(b.col - a.col) !== Math.sign(c.col - b.col) || Math.sign(b.row - a.row) !== Math.sign(c.row - b.row)) bends++;
  }
  return bends;
}

/** Full validity: in-bounds, contiguous, no revisits, on 'path' cells, edge to edge. */
function assertValid(map: GameMap, cols: number, rows: number): void {
  const { path, vertical } = map;
  for (let i = 0; i < path.length; i++) {
    const c = path[i]!;
    expect(c.col >= 0 && c.col < cols && c.row >= 0 && c.row < rows).toBe(true);
    expect(kindAt(map, c.col, c.row)).toBe('path');
    if (i > 0) expect(Math.abs(c.col - path[i - 1]!.col) + Math.abs(c.row - path[i - 1]!.row)).toBe(1);
  }
  const seen = new Set<string>();
  for (const c of path) seen.add(`${c.col},${c.row}`);
  expect(seen.size).toBe(path.length);
  if (vertical) {
    expect(path[0]!.row).toBe(0);
    expect(path[path.length - 1]!.row).toBe(rows - 1);
  } else {
    expect(path[0]!.col).toBe(0);
    expect(path[path.length - 1]!.col).toBe(cols - 1);
  }
}

describe('bend sweep: the jog adds exactly one bend for every seed', () => {
  for (const [cols, rows] of [
    [14, 8],
    [8, 14],
  ] as const) {
    it(`on ${cols}x${rows}: 3000 seeds keep the +1 bend and stay valid`, () => {
      for (let seed = 1; seed <= 3000; seed++) {
        const plain = generateMap(new Rng(seed), cols, rows, 5);
        const windy = generateMap(new Rng(seed), cols, rows, 5, 1);
        expect(countBends(windy)).toBe(countBends(plain) + 1);
        expect(mapExtraBends(plain)).toBe(0);
        expect(mapExtraBends(windy)).toBe(1);
        assertValid(plain, cols, rows);
        assertValid(windy, cols, rows);
      }
    });
  }
});
