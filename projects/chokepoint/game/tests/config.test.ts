import { describe, expect, it } from 'vitest';
import { rerollCost } from '../src/config';

describe('rerollCost', () => {
  it('climbs the run rerolls curve: 50, 70, 100, 140, 190, 250, then 320', () => {
    expect(rerollCost(0)).toBe(50);
    expect(rerollCost(1)).toBe(70);
    expect(rerollCost(2)).toBe(100);
    expect(rerollCost(3)).toBe(140);
    expect(rerollCost(4)).toBe(190);
    expect(rerollCost(5)).toBe(250);
    expect(rerollCost(6)).toBe(320);
  });
});
