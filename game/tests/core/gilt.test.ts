import { describe, expect, it } from 'vitest';
import { GILT_CHANCE, GILT_MULTIPLIER, rollGilt, shardXp } from '../../src/core/gilt';
import { Rng } from '../../src/core/rng';

describe('gilt shard rule', () => {
  it('is deterministic under a fixed seed', () => {
    const a = new Rng(1);
    const b = new Rng(1);
    const ra = Array.from({ length: 1000 }, () => rollGilt(a));
    expect(ra).toEqual(Array.from({ length: 1000 }, () => rollGilt(b)));
  });

  it('gilt fraction is in [0.03, 0.07] over 1000 seeded rolls', () => {
    const rng = new Rng(1);
    let gilt = 0;
    for (let i = 0; i < 1000; i++) if (rollGilt(rng)) gilt += 1;
    expect(gilt / 1000).toBeGreaterThanOrEqual(0.03);
    expect(gilt / 1000).toBeLessThanOrEqual(0.07);
  });

  it('takes exactly one rng draw per roll', () => {
    const a = new Rng(7);
    const b = new Rng(7);
    for (let i = 0; i < 50; i++) expect(rollGilt(a)).toBe(b.next() < GILT_CHANCE);
  });

  it('pins the roll parameters', () => {
    expect(GILT_CHANCE).toBe(0.05);
    expect(GILT_MULTIPLIER).toBe(3);
  });

  it('multiplies the drop, not a flat bonus', () => {
    expect(shardXp(1, false)).toBe(1);
    expect(shardXp(2, true)).toBe(6);
    expect(shardXp(0.5, true)).toBe(1.5);
  });
});
