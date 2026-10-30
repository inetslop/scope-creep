import { describe, expect, it } from 'vitest';
import { cellsBesidePath, generateMap, kindAt, mapExtraBends, type CellKind, type GameMap } from '../../src/core/map';
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

/** The cell as a [col, row] pair, for the pinned boards. */
const pairs = (cells: { col: number; row: number }[]): [number, number][] => cells.map((c) => [c.col, c.row]);

/** The rock cells of a board, for the pinned boards. */
const rockCells = (kinds: CellKind[][]): [number, number][] => {
  const out: [number, number][] = [];
  for (let row = 0; row < kinds.length; row++)
    for (let col = 0; col < kinds[row]!.length; col++)
      if (kinds[row]![col] === 'rock') out.push([col, row]);
  return out;
};

/**
 * The unowned boards before "The long way" existed: the road and the rocks, pinned per
 * orientation, seed and bends. With the node not owned, generation must stay byte-identical
 * to these, with or without "One more bend" owned.
 */
const PLAIN_BOARDS: Record<string, { path: [number, number][]; rocks: [number, number][] }> = {
  '14x8/seed-1/bends-0': {
    path: [[0, 4], [1, 4], [2, 4], [2, 3], [2, 2], [3, 2], [4, 2], [5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [6, 6], [7, 6], [7, 5], [7, 4], [7, 3], [8, 3], [9, 3], [10, 3], [10, 4], [10, 5], [11, 5], [12, 5], [13, 5]],
    rocks: [[6, 0], [8, 0], [13, 0], [4, 4], [0, 7]],
  },
  '14x8/seed-1/bends-1': {
    path: [[0, 4], [0, 5], [1, 5], [2, 5], [2, 4], [2, 3], [2, 2], [3, 2], [4, 2], [5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [6, 6], [7, 6], [7, 5], [7, 4], [7, 3], [8, 3], [9, 3], [10, 3], [10, 4], [10, 5], [11, 5], [12, 5], [13, 5]],
    rocks: [[8, 0], [11, 4], [4, 6], [11, 6], [0, 7]],
  },
  '14x8/seed-2/bends-0': {
    path: [[0, 5], [1, 5], [2, 5], [2, 4], [2, 3], [2, 2], [2, 1], [3, 1], [4, 1], [5, 1], [5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [6, 6], [7, 6], [8, 6], [8, 5], [8, 4], [8, 3], [8, 2], [9, 2], [10, 2], [10, 3], [10, 4], [10, 5], [10, 6], [11, 6], [12, 6], [13, 6]],
    rocks: [[1, 0], [7, 1], [9, 3], [3, 4], [7, 7]],
  },
  '14x8/seed-2/bends-1': {
    path: [[0, 5], [0, 6], [1, 6], [2, 6], [2, 5], [2, 4], [2, 3], [2, 2], [3, 2], [4, 2], [5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [6, 6], [7, 6], [8, 6], [8, 5], [8, 4], [8, 3], [8, 2], [9, 2], [10, 2], [10, 3], [10, 4], [10, 5], [10, 6], [11, 6], [12, 6], [13, 6]],
    rocks: [[10, 0], [0, 2], [13, 3], [11, 4], [3, 5]],
  },
  '14x8/seed-3/bends-0': {
    path: [[0, 5], [1, 5], [2, 5], [2, 4], [2, 3], [2, 2], [3, 2], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [5, 6], [6, 6], [6, 5], [6, 4], [6, 3], [6, 2], [7, 2], [8, 2], [8, 3], [8, 4], [9, 4], [10, 4], [11, 4], [11, 3], [11, 2], [11, 1], [12, 1], [13, 1]],
    rocks: [[2, 0], [10, 0], [3, 1], [12, 5], [7, 6]],
  },
  '14x8/seed-3/bends-1': {
    path: [[0, 5], [0, 6], [1, 6], [2, 6], [2, 5], [2, 4], [2, 3], [2, 2], [3, 2], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [5, 6], [6, 6], [6, 5], [6, 4], [6, 3], [6, 2], [7, 2], [8, 2], [8, 3], [8, 4], [9, 4], [10, 4], [11, 4], [11, 3], [11, 2], [11, 1], [12, 1], [13, 1]],
    rocks: [[2, 0], [2, 1], [5, 5], [11, 5], [13, 5]],
  },
  '8x14/seed-1/bends-0': {
    path: [[4, 0], [4, 1], [4, 2], [3, 2], [2, 2], [2, 3], [2, 4], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [6, 6], [6, 7], [5, 7], [4, 7], [3, 7], [3, 8], [3, 9], [3, 10], [4, 10], [5, 10], [5, 11], [5, 12], [5, 13]],
    rocks: [[1, 1], [6, 1], [6, 2], [2, 8], [3, 11]],
  },
  '8x14/seed-1/bends-1': {
    path: [[4, 0], [5, 0], [5, 1], [5, 2], [4, 2], [3, 2], [2, 2], [2, 3], [2, 4], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [6, 6], [6, 7], [5, 7], [4, 7], [3, 7], [3, 8], [3, 9], [3, 10], [4, 10], [5, 10], [5, 11], [5, 12], [5, 13]],
    rocks: [[6, 1], [0, 9], [6, 10], [2, 11], [3, 11]],
  },
  '8x14/seed-2/bends-0': {
    path: [[5, 0], [5, 1], [5, 2], [4, 2], [3, 2], [2, 2], [1, 2], [1, 3], [1, 4], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [6, 6], [6, 7], [6, 8], [5, 8], [4, 8], [3, 8], [2, 8], [2, 9], [2, 10], [3, 10], [4, 10], [5, 10], [6, 10], [6, 11], [6, 12], [6, 13]],
    rocks: [[1, 0], [5, 3], [3, 7], [0, 8], [0, 13]],
  },
  '8x14/seed-2/bends-1': {
    path: [[5, 0], [6, 0], [6, 1], [6, 2], [5, 2], [4, 2], [3, 2], [2, 2], [2, 3], [2, 4], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [6, 6], [6, 7], [6, 8], [5, 8], [4, 8], [3, 8], [2, 8], [2, 9], [2, 10], [3, 10], [4, 10], [5, 10], [6, 10], [6, 11], [6, 12], [6, 13]],
    rocks: [[0, 2], [1, 5], [0, 8], [4, 9], [7, 9]],
  },
  '8x14/seed-3/bends-0': {
    path: [[5, 0], [5, 1], [5, 2], [4, 2], [3, 2], [2, 2], [2, 3], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [6, 5], [6, 6], [5, 6], [4, 6], [3, 6], [2, 6], [2, 7], [2, 8], [3, 8], [4, 8], [4, 9], [4, 10], [4, 11], [3, 11], [2, 11], [1, 11], [1, 12], [1, 13]],
    rocks: [[2, 0], [0, 2], [1, 3], [3, 9], [0, 10]],
  },
  '8x14/seed-3/bends-1': {
    path: [[5, 0], [6, 0], [6, 1], [6, 2], [5, 2], [4, 2], [3, 2], [2, 2], [2, 3], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [6, 5], [6, 6], [5, 6], [4, 6], [3, 6], [2, 6], [2, 7], [2, 8], [3, 8], [4, 8], [4, 9], [4, 10], [4, 11], [3, 11], [2, 11], [1, 11], [1, 12], [1, 13]],
    rocks: [[2, 0], [1, 3], [6, 8], [3, 9], [6, 9]],
  },
};

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

  it('places the requested rocks (a choke fold may relocate one), never on the path', () => {
    const map = generateMap(new Rng(7), 14, 8, 5);
    const rocks = map.kinds.flat().filter((k) => k === 'rock').length;
    expect(rocks).toBeGreaterThanOrEqual(4);
    expect(rocks).toBeLessThanOrEqual(5);
    for (const c of map.path) expect(map.kinds[c.row]![c.col]!).not.toBe('rock');
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

describe('generateMap with the node not owned', () => {
  for (const [cols, rows] of [
    [14, 8],
    [8, 14],
  ] as const) {
    for (const seed of [1, 2, 3]) {
      for (const bends of [0, 1]) {
        it(`on ${cols}x${rows} seed ${seed} with ${bends} bend(s): the unowned board is the pinned one, byte for byte`, () => {
          const map = generateMap(new Rng(seed), cols, rows, 5, bends);
          const pinned = PLAIN_BOARDS[`${cols}x${rows}/seed-${seed}/bends-${bends}`]!;
          expect(pairs(map.path)).toEqual(pinned.path);
          expect(rockCells(map.kinds)).toEqual(pinned.rocks);
        });
      }
    }
  }
});

describe('generateMap with the longer road', () => {
  for (const [cols, rows] of [
    [14, 8],
    [8, 14],
  ] as const) {
    for (const seed of [1, 2, 3, 4, 5, 42]) {
      for (const bends of [0, 1]) {
        it(`on ${cols}x${rows} seed ${seed} with ${bends} bend(s): the owned road is strictly longer and both boards stay valid`, () => {
          const plain = generateMap(new Rng(seed), cols, rows, 5, bends);
          const long = generateMap(new Rng(seed), cols, rows, 5, bends, 1.25);
          expect(long.path.length).toBeGreaterThan(plain.path.length);
          expectValidBoard(plain, cols, rows);
          expectValidBoard(long, cols, rows);
        });
      }
    }
  }

  it('comes out about 25% longer: the mean length ratio over the seeds sits between 1.2 and 1.4', () => {
    const ratios: number[] = [];
    for (const [cols, rows] of [
      [14, 8],
      [8, 14],
    ] as const) {
      for (const seed of [1, 2, 3, 4, 5]) {
        for (const bends of [0, 1]) {
          const plain = generateMap(new Rng(seed), cols, rows, 5, bends);
          const long = generateMap(new Rng(seed), cols, rows, 5, bends, 1.25);
          ratios.push(long.path.length / plain.path.length);
        }
      }
    }
    expect(ratios.length).toBe(20); // 5 seeds x both orientations x both bend states
    const mean = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    expect(mean).toBeGreaterThan(1.2);
    expect(mean).toBeLessThan(1.4);
  });

  it('is the same longer board for the same seed: a resumed run regenerates it exactly', () => {
    expect(generateMap(new Rng(42), 14, 8, 5, 1, 1.25)).toEqual(generateMap(new Rng(42), 14, 8, 5, 1, 1.25));
  });
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
