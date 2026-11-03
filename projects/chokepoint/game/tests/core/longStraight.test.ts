import { describe, expect, it } from 'vitest';
import { BOARD_FACT_SEEDS, boardFactMap } from '../../src/core/boardFacts';
import { boardHasLongStraight, longestStraight, LONG_STRAIGHT_MIN } from '../../src/core/longStraight';
import { generateMap } from '../../src/core/map';
import { Rng } from '../../src/core/rng';

describe('the long straight', () => {
  it('on 14x8 and 8x14: 2000 seeds carry a longest straight of LONG_STRAIGHT_MIN+ between one in seven and one in four', () => {
    let long = 0;
    for (const [cols, rows] of [
      [14, 8],
      [8, 14],
    ] as const) {
      for (let seed = 1; seed <= 2000; seed++) {
        const map = generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1, false, false, seed);
        // Deterministic: a fresh identical call gives the same board (the board code's round-trip rule).
        expect(map).toEqual(generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1, false, false, seed));
        if (!boardHasLongStraight(map)) continue;
        long++;
        expect(longestStraight(map.path)).toBeGreaterThanOrEqual(LONG_STRAIGHT_MIN);
      }
    }
    // About one in five boards carries the long straight (the measured rate over this batch: 867/4000).
    expect(long / 4000).toBeGreaterThanOrEqual(0.14);
    expect(long / 4000).toBeLessThanOrEqual(0.26);
  });

  it('the constant is the measured one: six, the value one in five boards reach (the as-grown road runs no longer straight off the fork and the loop)', () => {
    expect(LONG_STRAIGHT_MIN).toBe(6);
  });

  it('never with the fork or the loop, and the committed seed\'s board carries it', () => {
    for (const [cols, rows] of [
      [14, 8],
      [8, 14],
    ] as const) {
      for (let seed = 1; seed <= 1000; seed++) {
        const map = generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1, false, false, seed);
        if (!boardHasLongStraight(map)) continue;
        expect(map.fork).toBeUndefined(); // the long straight never shares a board with the fork's or the loop's silhouette
        expect(map.loop).toBeUndefined();
      }
    }
    const committed = boardFactMap('longstraight')!;
    expect(boardHasLongStraight(committed)).toBe(true);
    // The committed board visibly runs it: its longest straight is at least the constant.
    expect(longestStraight(committed.path)).toBeGreaterThanOrEqual(LONG_STRAIGHT_MIN);
  });

  it('the trait is a property: the committed board is its seed\'s own board, grown without a seed, byte-identically', () => {
    const s = BOARD_FACT_SEEDS.longstraight!;
    expect(boardFactMap('longstraight')).toEqual(generateMap(new Rng(s.seed), 8, 14, 5));
  });
});
