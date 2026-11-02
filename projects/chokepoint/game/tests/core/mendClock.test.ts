import { describe, expect, it } from 'vitest';
import { getEnemy } from '../../src/content/enemies';
import { mendsDue, nextMendAt } from '../../src/core/mendClock';

const rule = getEnemy('mender').mends!; // { everySec: 5, count: 4, radius: 3, frac: 0.15, telegraphSec: 1.2, escortId: 'ward' }

describe('mendClock (the Mender)', () => {
  it('mendsDue: 5 s apart, the first at 5 s, four max, never below 0', () => {
    expect(mendsDue(0, rule)).toBe(0);
    expect(mendsDue(4.99, rule)).toBe(0);
    expect(mendsDue(5, rule)).toBe(1);
    expect(mendsDue(10, rule)).toBe(2);
    expect(mendsDue(15, rule)).toBe(3);
    expect(mendsDue(20, rule)).toBe(4);
    expect(mendsDue(1e6, rule)).toBe(4); // capped at four
    expect(mendsDue(-1, rule)).toBe(0); // never below 0
  });

  it('nextMendAt: the mender clock of the next mend, -1 once all four have landed', () => {
    expect(nextMendAt(0, rule)).toBe(5);
    expect(nextMendAt(5, rule)).toBe(10);
    expect(nextMendAt(15, rule)).toBe(20);
    expect(nextMendAt(20, rule)).toBe(-1);
    expect(nextMendAt(1e6, rule)).toBe(-1);
  });
});
