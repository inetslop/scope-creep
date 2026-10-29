import { describe, expect, it } from 'vitest';
import { cellsBesidePath, generateMap, kindAt, mapExtraBends, type GameMap } from '../../src/core/map';
import { Rng } from '../../src/core/rng';

/** The path's bends: the cells whose direction in differs from its direction out (i in 1..len-2). */
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

/** A board is valid: right size, edge-to-edge path, side-adjacent steps, no revisits, on 'path' cells. */
function expectValidBoard(map: GameMap, cols: number, rows: number): void {
  expect(map.cols).toBe(cols);
  expect(map.rows).toBe(rows);
  const { path, vertical } = map;
  if (vertical) {
    expect(path[0]!.row).toBe(0);
    expect(path[path.length - 1]!.row).toBe(rows - 1);
  } else {
    expect(path[0]!.col).toBe(0);
    expect(path[path.length - 1]!.col).toBe(cols - 1);
  }
  const seen = new Set<string>();
  path.forEach((c, i) => {
    expect(kindAt(map, c.col, c.row)).toBe('path');
    const key = `${c.col},${c.row}`;
    expect(seen.has(key)).toBe(false);
    seen.add(key);
    if (i > 0) expect(Math.abs(c.col - path[i - 1]!.col) + Math.abs(c.row - path[i - 1]!.row)).toBe(1);
  });
}

describe('generateMap', () => {
  for (const [cols, rows] of [
    [14, 8],
    [8, 14],
  ] as const) {
    it(`makes a connected path edge to edge on ${cols}x${rows} boards, for many seeds`, () => {
      for (let seed = 1; seed <= 200; seed++) {
        const map = generateMap(new Rng(seed), cols, rows, 5);
        const { path, vertical } = map;
        expect(vertical).toBe(rows > cols);
        // Starts on the entrance edge, ends on the exit edge.
        if (vertical) {
          expect(path[0]!.row).toBe(0);
          expect(path[path.length - 1]!.row).toBe(rows - 1);
        } else {
          expect(path[0]!.col).toBe(0);
          expect(path[path.length - 1]!.col).toBe(cols - 1);
        }
        // Every step moves to a side neighbour, never revisits a cell, stays on the board.
        const seen = new Set<string>();
        path.forEach((c, i) => {
          expect(kindAt(map, c.col, c.row)).toBe('path');
          const key = `${c.col},${c.row}`;
          expect(seen.has(key)).toBe(false);
          seen.add(key);
          if (i > 0) expect(Math.abs(c.col - path[i - 1]!.col) + Math.abs(c.row - path[i - 1]!.row)).toBe(1);
        });
      }
    });
  }

  it('places exactly the requested rocks, off the path', () => {
    const map = generateMap(new Rng(7), 14, 8, 5);
    const rocks = map.kinds.flat().filter((k) => k === 'rock').length;
    expect(rocks).toBe(5);
  });

  it('is the same board for the same seed', () => {
    expect(generateMap(new Rng(42), 14, 8, 5)).toEqual(generateMap(new Rng(42), 14, 8, 5));
  });
});

describe('generateMap with extra bends', () => {
  for (const [cols, rows] of [
    [14, 8],
    [8, 14],
  ] as const) {
    for (const seed of [1, 2, 3, 4, 5, 42]) {
      it(`on ${cols}x${rows} seed ${seed}: the jog adds exactly one bend and keeps the board valid`, () => {
        const plain = generateMap(new Rng(seed), cols, rows, 5);
        const windy = generateMap(new Rng(seed), cols, rows, 5, 1);
        expect(countBends(windy)).toBe(countBends(plain) + 1);
        expect(mapExtraBends(plain)).toBe(0);
        expect(mapExtraBends(windy)).toBe(1);
        expectValidBoard(plain, cols, rows);
        expectValidBoard(windy, cols, rows);
      });
    }
  }
});

describe('cellsBesidePath', () => {
  it('lists open cells touching the path, nearest the entrance first', () => {
    const map = generateMap(new Rng(3), 14, 8, 5);
    const cells = cellsBesidePath(map);
    expect(cells.length).toBeGreaterThan(10);
    for (const c of cells) {
      expect(kindAt(map, c.col, c.row)).toBe('open');
      expect(map.path.some((p) => Math.abs(p.col - c.col) <= 1 && Math.abs(p.row - c.row) <= 1)).toBe(true);
    }
    const first = cells[0]!;
    const start = map.path[0]!;
    expect(Math.abs(first.col - start.col) <= 1 && Math.abs(first.row - start.row) <= 1).toBe(true);
  });
});
