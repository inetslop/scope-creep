import { describe, expect, it } from 'vitest';
import { comboGoldBonus } from '../../src/core/comboGold';

describe('comboGoldBonus', () => {
  it('pays the chain milestones: the fifth kill +2, the tenth +4', () => {
    expect(comboGoldBonus(5)).toBe(2);
    expect(comboGoldBonus(10)).toBe(4);
  });

  it('pays nothing on every other kill', () => {
    for (const chain of [0, 1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 20]) expect(comboGoldBonus(chain)).toBe(0);
  });
});
