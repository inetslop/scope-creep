import { describe, expect, it } from 'vitest';
import { getEnemy } from '../../src/content/enemies';
import { nextPopAt, popsDue } from '../../src/core/hivePops';

const rule = getEnemy('hive').pops!; // { everySec: 6, max: 5, telegraphSec: 0.8, into: 'dot' }

describe('hivePops (the Hive)', () => {
  it('popsDue: 6 s apart, the first at 6 s, five max, never below 0', () => {
    expect(popsDue(0, rule)).toBe(0);
    expect(popsDue(5.99, rule)).toBe(0);
    expect(popsDue(6, rule)).toBe(1);
    expect(popsDue(12, rule)).toBe(2);
    expect(popsDue(29.99, rule)).toBe(4);
    expect(popsDue(30, rule)).toBe(5);
    expect(popsDue(1e6, rule)).toBe(5); // capped at five
    expect(popsDue(-1, rule)).toBe(0); // never below 0
  });

  it('nextPopAt: the hive clock of the next pop, -1 once all five are popped', () => {
    expect(nextPopAt(0, rule)).toBe(6);
    expect(nextPopAt(6, rule)).toBe(12);
    expect(nextPopAt(24, rule)).toBe(30);
    expect(nextPopAt(30, rule)).toBe(-1);
    expect(nextPopAt(1e6, rule)).toBe(-1);
  });
});
