import { describe, expect, it } from 'vitest';
import { LEVEL_AUGMENTS } from '../../src/content/levels';
import { dailyLevel, dailyOrder, dailySeeds, utcDay } from '../../src/core/daily';

const day = '2026-03-01';
const next = '2026-03-02';

describe('the daily board pick', () => {
  it('one UTC day gives the same three seeds and the same three augment orders, on every call', () => {
    const a = dailySeeds(day);
    expect(dailySeeds(day)).toEqual(a); // every call
    expect(a).toHaveLength(3);
    for (const s of a) {
      expect(Number.isInteger(s)).toBe(true);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThan(2 ** 31);
    }
    for (const s of a) {
      const order = dailyOrder(s);
      expect(dailyOrder(s)).toEqual(order); // every call
      expect(order).toHaveLength(LEVEL_AUGMENTS.length);
      expect(new Set(order)).toEqual(new Set(LEVEL_AUGMENTS.map((x) => x.id))); // a shuffle of the set, no repeats
    }
  });

  it('the next day gives different seeds and different orders', () => {
    const a = dailySeeds(day);
    const b = dailySeeds(next);
    for (let i = 0; i < 3; i++) {
      expect(b[i]).not.toBe(a[i]);
      expect(dailyOrder(b[i]!)).not.toEqual(dailyOrder(a[i]!));
    }
  });

  it('level L takes the first L of the board\'s order, and a higher level extends the lower one', () => {
    const s = dailySeeds(day)[0]!;
    const order = dailyOrder(s);
    expect(dailyLevel(s, 0)).toEqual([]);
    expect(dailyLevel(s, -2)).toEqual([]); // a broken level is nothing
    for (let l = 0; l <= LEVEL_AUGMENTS.length; l++) {
      expect(dailyLevel(s, l)).toEqual(order.slice(0, l));
      if (l > 0) expect(dailyLevel(s, l).slice(0, l - 1)).toEqual(dailyLevel(s, l - 1)); // nested
    }
  });

  it('the day flips at 00:00 UTC, whatever the local time zone', () => {
    const midnight = Date.UTC(2026, 0, 2, 0, 0, 0);
    expect(utcDay(midnight - 1000)).toBe('2026-01-01');
    expect(utcDay(midnight + 1000)).toBe('2026-01-02');
  });
});
