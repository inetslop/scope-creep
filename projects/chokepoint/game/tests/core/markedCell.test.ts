import { describe, expect, it } from 'vitest';
import { GRID, ROCKS } from '../../src/config';
import { generateMap, kindAt } from '../../src/core/map';
import { boardHasDoubleMark, markedCell, markedCells, MARKED_DMG_MUL } from '../../src/core/markedCell';
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

describe('boardHasDoubleMark', () => {
  it('is the seed hash: deterministic, one in four', () => {
    let doubled = 0;
    for (let seed = 1; seed <= 4000; seed++) {
      expect(boardHasDoubleMark(seed)).toBe(boardHasDoubleMark(seed));
      doubled += boardHasDoubleMark(seed) ? 1 : 0;
    }
    expect(doubled).toBeGreaterThanOrEqual(850);
    expect(doubled).toBeLessThanOrEqual(1150);
  });
});

describe('markedCells', () => {
  it('a double-mark board has two marks on different open cells; the rest have one', () => {
    let doubled = 0;
    for (let seed = 1; seed <= 2000; seed++) {
      const map = makeMap(seed);
      const cells = markedCells(map, seed);
      if (boardHasDoubleMark(seed)) {
        doubled++;
        expect(cells.length).toBe(2);
        expect(kindAt(map, cells[0]!.col, cells[0]!.row)).toBe('open');
        expect(kindAt(map, cells[1]!.col, cells[1]!.row)).toBe('open');
        expect(cells[0]!.col === cells[1]!.col && cells[0]!.row === cells[1]!.row).toBe(false);
      } else {
        expect(cells.length).toBe(1);
        expect(kindAt(map, cells[0]!.col, cells[0]!.row)).toBe('open');
      }
    }
    expect(doubled).toBeGreaterThanOrEqual(400);
    expect(doubled).toBeLessThanOrEqual(800);
  });

  it('the first mark is the board\'s marked cell, in every seed', () => {
    for (let seed = 0; seed < 500; seed++) {
      const map = makeMap(seed);
      expect(markedCells(map, seed)[0]!).toEqual(markedCell(map, seed));
    }
  });

  it('regrows the same marks from the same seed', () => {
    for (let seed = 0; seed < 50; seed++) {
      expect(markedCells(makeMap(seed), seed)).toEqual(markedCells(makeMap(seed), seed));
    }
  });
});
