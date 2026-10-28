import { describe, expect, it } from 'vitest';
import { AUGMENTS } from '../../src/content/augments';
import { rollOffer } from '../../src/core/augments';
import { Rng } from '../../src/core/rng';
import { rollTier, tierOdds } from '../../src/core/tiers';

describe('tierOdds', () => {
  it('is flat 70/25/5 until wave 4', () => {
    for (const wave of [1, 2, 3, 4]) expect(tierOdds(wave)).toEqual({ common: 70, rare: 25, epic: 5 });
  });

  it('grows epic and rare by one per wave from wave 5, capped at 15 and 33', () => {
    expect(tierOdds(5)).toEqual({ common: 68, rare: 26, epic: 6 });
    expect(tierOdds(10)).toEqual({ common: 58, rare: 31, epic: 11 });
    expect(tierOdds(12)).toEqual({ common: 54, rare: 33, epic: 13 });
    expect(tierOdds(14)).toEqual({ common: 52, rare: 33, epic: 15 });
    expect(tierOdds(15)).toEqual({ common: 52, rare: 33, epic: 15 });
    expect(tierOdds(40)).toEqual({ common: 52, rare: 33, epic: 15 });
  });

  it('always sums to 100 with a non-negative common share', () => {
    for (let wave = 0; wave <= 60; wave++) {
      const o = tierOdds(wave);
      expect(o.common + o.rare + o.epic).toBe(100);
      expect(o.common).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('rollTier with the wave curve', () => {
  it('the same seed produces the same tier sequence at a given wave', () => {
    const seq = (wave: number): string[] => {
      const rng = new Rng(42);
      return Array.from({ length: 300 }, () => rollTier(rng, wave));
    };
    expect(seq(15)).toEqual(seq(15));
  });

  it('a run replayed with the same seed gets the same card tiers', () => {
    const replay = (): string[] => {
      const rng = new Rng(1234);
      const tiers: string[] = [];
      for (let wave = 1; wave <= 25; wave++) for (const c of rollOffer(rng, AUGMENTS, 3, wave, wave === 1)) tiers.push(c.tier);
      return tiers;
    };
    const tiers = replay();
    expect(tiers).toEqual(replay());
    expect(tiers.length).toBe(75);
    expect(tiers).toContain('epic');
  });

  it('the epic share of 3000 rolls is clearly higher at wave 15 than at wave 5', () => {
    const share = (wave: number): number => {
      const rng = new Rng(7);
      let epic = 0;
      for (let i = 0; i < 3000; i++) if (rollTier(rng, wave) === 'epic') epic += 1;
      return epic / 3000;
    };
    expect(share(15)).toBeGreaterThan(share(5) + 0.02);
  });
});
