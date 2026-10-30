import { describe, expect, it } from 'vitest';
import { chokeCells } from '../../src/core/choke';
import { generateMap, kindAt, type GameMap } from '../../src/core/map';
import { Rng } from '../../src/core/rng';

/** The path runs edge to edge, is side-adjacent, uses no cell twice, stays in bounds, and sits on 'path'. */
function expectValidPath(map: GameMap): void {
  const { path, vertical, cols, rows } = map;
  if (vertical) {
    expect(path[0]!.row).toBe(0);
    expect(path[path.length - 1]!.row).toBe(rows - 1);
  } else {
    expect(path[0]!.col).toBe(0);
    expect(path[path.length - 1]!.col).toBe(cols - 1);
  }
  const seen = new Set<string>();
  path.forEach((c, i) => {
    expect(c.col >= 0 && c.col < cols && c.row >= 0 && c.row < rows).toBe(true);
    expect(kindAt(map, c.col, c.row)).toBe('path');
    const key = `${c.col},${c.row}`;
    expect(seen.has(key)).toBe(false);
    seen.add(key);
    if (i > 0) expect(Math.abs(c.col - path[i - 1]!.col) + Math.abs(c.row - path[i - 1]!.row)).toBe(1);
  });
}

describe('two chokes', () => {
  for (const [cols, rows] of [
    [14, 8],
    [8, 14],
  ] as const) {
    it(`on ${cols}x${rows}: 50 fresh seeds every carry two chokes, and the boards stay valid`, () => {
      for (let seed = 1; seed <= 50; seed++) {
        const grown = generateMap(new Rng(seed), cols, rows, 5, 0, 1, 1); // bgen 1: the board as grown
        const today = generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2); // bgen 2: today's one-choke board
        const two = generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 2); // the node's board: two chokes
        expectValidPath(two);
        expect(chokeCells(two).length).toBeGreaterThanOrEqual(2);
        // Deterministic: a fresh identical call gives the same board.
        expect(two).toEqual(generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 2));
        // A road that already folds twice is untouched (byte-identical to the as-grown board).
        if (chokeCells(grown).length >= 2) expect(two).toEqual(grown);
        // Without the node: today's one-choke board, byte-identical.
        expect(today).toEqual(generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1));
      }
    });
  }

  it('the double fold holds across bends and road length', () => {
    for (const mul of [1, 1.25]) {
      for (const bends of [0, 1]) {
        for (let seed = 1; seed <= 40; seed++) {
          const map = generateMap(new Rng(seed), 14, 8, 5, bends, mul, 2, 2);
          expectValidPath(map);
          expect(chokeCells(map).length).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });
});
