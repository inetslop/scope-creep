import { describe, expect, it } from 'vitest';
import { GRID, ROCKS } from '../../src/config';
import { generateMap, kindAt } from '../../src/core/map';
import { markedCell, MARKED_DMG_MUL } from '../../src/core/markedCell';
import { Rng } from '../../src/core/rng';

const makeMap = (seed: number) => generateMap(new Rng(seed), GRID.long, GRID.short, ROCKS);

describe('markedCell', () => {
  it('is one of the board\'s open build cells', () => {
    for (let seed = 0; seed < 200; seed++) {
      const map = makeMap(seed);
      const c = markedCell(map, seed);
      expect(kindAt(map, c.col, c.row)).toBe('open');
    }
  });

  it('regrows the same board and the same cell from the same seed', () => {
    const seed = 42;
    const a = markedCell(makeMap(seed), seed);
    const b = markedCell(makeMap(seed), seed);
    expect(a).toEqual(b);
  });

  it('marks a different cell across seeds (not always the same cell)', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 50; seed++) {
      const map = makeMap(seed);
      const c = markedCell(map, seed);
      seen.add(`${c.col},${c.row}`);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('deals 25% more damage (a Common Bolt on the cell hits 15 instead of 12)', () => {
    expect(MARKED_DMG_MUL).toBe(1.25);
    expect(12 * MARKED_DMG_MUL).toBe(15);
  });
});
