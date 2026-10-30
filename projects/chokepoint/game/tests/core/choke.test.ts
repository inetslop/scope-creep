import { describe, expect, it } from 'vitest';
import { CHOKES_APART, CHOKES_RANGE, chokeCells } from '../../src/core/choke';
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

/** Recomputes the choke: the cell is really within CHOKES_RANGE of two path cells CHOKES_APART steps apart. */
function expectRealChoke(map: GameMap, col: number, row: number): void {
  let first = -1;
  let last = -1;
  for (let i = 0; i < map.path.length; i++) {
    const p = map.path[i]!;
    if (Math.hypot(p.col - col, p.row - row) <= CHOKES_RANGE) {
      if (first === -1) first = i;
      last = i;
    }
  }
  expect(first).not.toBe(-1);
  expect(last - first).toBeGreaterThanOrEqual(CHOKES_APART);
}

describe('choke cells', () => {
  for (const [cols, rows] of [
    [14, 8],
    [8, 14],
  ] as const) {
    it(`on ${cols}x${rows}: 50 fresh seeds every carry a choke, and the boards stay valid`, () => {
      for (let seed = 1; seed <= 50; seed++) {
        const map = generateMap(new Rng(seed), cols, rows, 5);
        expectValidPath(map);
        // Rocks: the fold may relocate one, but never onto the path.
        const rocks = map.kinds.flat().filter((k) => k === 'rock').length;
        expect(rocks).toBeGreaterThanOrEqual(4);
        expect(rocks).toBeLessThanOrEqual(5);
        for (const c of map.path) expect(kindAt(map, c.col, c.row)).not.toBe('rock');
        // At least one choke, and every one is a real buildable double-cover cell.
        const chokes = chokeCells(map);
        expect(chokes.length).toBeGreaterThan(0);
        for (const c of chokes) {
          expect(kindAt(map, c.col, c.row)).toBe('open');
          expectRealChoke(map, c.col, c.row);
        }
      }
    });

    it(`on ${cols}x${rows}: the same seed gives the same board`, () => {
      for (const seed of [1, 7, 42]) {
        expect(generateMap(new Rng(seed), cols, rows, 5)).toEqual(generateMap(new Rng(seed), cols, rows, 5));
      }
    });
  }

  it('a board that already has a choke is untouched; the fold only reroutes boards without one', () => {
    let already = 0;
    let folded = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const grown = generateMap(new Rng(seed), 14, 8, 5, 0, 1, 1); // bgen 1: the board as grown
      const withChoke = generateMap(new Rng(seed), 14, 8, 5, 0, 1, 2); // bgen 2: the guaranteed-choke board
      expect(chokeCells(withChoke).length).toBeGreaterThan(0); // the guarantee, for every seed
      if (chokeCells(grown).length > 0) {
        // Already a choke: the pass is a no-op, byte-identical to the as-grown board.
        expect(withChoke).toEqual(grown);
        already++;
      } else {
        // No choke: the fold reroutes the tail and the result still carries a choke.
        expect(withChoke).not.toEqual(grown);
        expectValidPath(withChoke);
        folded++;
      }
    }
    expect(already).toBeGreaterThan(0); // some as-grown boards already have a choke
    // Every seed is exactly one of the two cases. With the current staircase generator the
    // as-grown board always already carries a choke (a bend within Splash's range), so the fold
    // never needs to fire here; the else branch guards boards a future generator change produces.
    expect(already + folded).toBe(200);
  });
});
