import { describe, expect, it } from 'vitest';
import { boardCode } from '../../src/core/boardCode';

describe('boardCode', () => {
  it('is always four uppercase A-Z letters', () => {
    for (const seed of [0, 1, 1234, 2 ** 31 - 1, 987654321]) expect(boardCode(seed)).toMatch(/^[A-Z]{4}$/);
  });

  it('is deterministic: the same seed always gives the same code', () => {
    expect(boardCode(1234)).toBe(boardCode(1234));
  });

  it('different boards give different codes', () => {
    const seeds = [0, 1, 2, 999, 1234, 424242, 2 ** 31 - 1];
    expect(new Set(seeds.map(boardCode)).size).toBe(7);
  });
});
