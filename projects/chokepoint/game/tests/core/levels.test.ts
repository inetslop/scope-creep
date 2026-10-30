import { describe, expect, it } from 'vitest';
import { dot } from '../../src/content/enemies/dot';
import { LEVEL_AUGMENTS, getLevelAugment } from '../../src/content/levels';
import { LEVEL_UNLOCK_WAVE, capLevelChoice, levelMultiplier, levelMultiplierLabel, levelSlotsAfter } from '../../src/core/levels';
import { waveHpMul } from '../../src/core/waves';

describe('level augments', () => {
  it('the unlock is wave 30, and a slot is earned once and never lost', () => {
    expect(LEVEL_UNLOCK_WAVE).toBe(30);
    expect(levelSlotsAfter(0, 29)).toBe(0); // ended just short
    expect(levelSlotsAfter(0, 30)).toBe(1); // reached the unlock wave (a run dying during it counts)
    expect(levelSlotsAfter(1, 30)).toBe(1); // a second run there earns nothing more
    expect(levelSlotsAfter(1, 40)).toBe(1); // never more than one
    expect(levelSlotsAfter(1, 10)).toBe(1); // never fewer
  });

  it('the capped choice keeps only known ids, the first of them up to the slots', () => {
    expect(capLevelChoice(0, ['tough'])).toEqual([]);
    expect(capLevelChoice(1, ['tough', 'nope'])).toEqual(['tough']);
    expect(capLevelChoice(2, ['nope', 'tough'])).toEqual(['tough']);
  });

  it('the multiplier is 1 plus the chosen augments\' bonuses, and its label', () => {
    expect(levelMultiplier([])).toBe(1);
    expect(levelMultiplier(['tough'])).toBe(1.25);
    expect(levelMultiplier(['nope', 'tough'])).toBe(1.25);
    expect(levelMultiplierLabel([])).toBe('×1.0');
    expect(levelMultiplierLabel(['tough'])).toBe('×1.25');
  });

  it('Tough is the one level augment, worth +25%', () => {
    expect(LEVEL_AUGMENTS.map((a) => a.id)).toEqual(['tough']);
    const tough = getLevelAugment('tough');
    expect(tough).toBeDefined();
    expect(tough?.bonus).toBe(0.25);
    expect(getLevelAugment('nope')).toBeUndefined();
  });

  it('with Tough on, an enemy has 25% more health than the wave\'s own growth gives, waves 1 to 30; off, it is the run of today', () => {
    for (let wave = 1; wave <= 30; wave++) {
      const plain = Math.round(dot.hp * waveHpMul(wave));
      expect(Math.round(dot.hp * waveHpMul(wave) * levelMultiplier(['tough']))).toBe(Math.round(dot.hp * waveHpMul(wave) * 1.25));
      expect(Math.round(dot.hp * waveHpMul(wave) * levelMultiplier([]))).toBe(plain);
    }
  });
});
