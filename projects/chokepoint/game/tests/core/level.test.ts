import { describe, expect, it } from 'vitest';
import { LEVELS, MAX_WAVE, WAVES_PER_LEVEL, boardSeedFor, isLevelClear, isRunWin, levelLengthMul, levelOfWave } from '../../src/core/level';

describe('the level rule', () => {
  it('numbers the run in three levels of ten waves each', () => {
    for (let wave = 1; wave <= MAX_WAVE; wave++) {
      expect(levelOfWave(wave)).toBe(Math.ceil(wave / WAVES_PER_LEVEL));
    }
    expect(levelOfWave(1)).toBe(1);
    expect(levelOfWave(10)).toBe(1);
    expect(levelOfWave(11)).toBe(2);
    expect(levelOfWave(20)).toBe(2);
    expect(levelOfWave(21)).toBe(3);
    expect(levelOfWave(30)).toBe(3);
  });

  it('clamps outside the run: wave 0 is level 1, wave 31 level 3', () => {
    expect(levelOfWave(0)).toBe(1);
    expect(levelOfWave(-5)).toBe(1);
    expect(levelOfWave(31)).toBe(3);
  });

  it('clears a level only on waves 10 and 20', () => {
    for (const wave of [0, 4, 8, 9, 11, 12, 19, 21, 29, 30]) expect(isLevelClear(wave)).toBe(false);
    expect(isLevelClear(10)).toBe(true);
    expect(isLevelClear(20)).toBe(true);
  });

  it('wins the run only on wave 30', () => {
    for (const wave of [0, 9, 10, 19, 20, 29, 31]) expect(isRunWin(wave)).toBe(false);
    expect(isRunWin(30)).toBe(true);
  });

  it('lengthens the road a quarter per level: 1, 1.25, 1.5625, and the run is 30 waves', () => {
    expect(WAVES_PER_LEVEL).toBe(10);
    expect(LEVELS).toBe(3);
    expect(MAX_WAVE).toBe(30);
    expect(levelLengthMul(1)).toBe(1);
    expect(levelLengthMul(2)).toBe(1.25);
    expect(levelLengthMul(3)).toBe(1.5625);
  });

  it('seeds a level board from the run seed and the level, level 1 as the seed itself', () => {
    for (const seed of [1, 42, 123456789]) {
      const l2 = boardSeedFor(seed, 2);
      const l3 = boardSeedFor(seed, 3);
      expect(boardSeedFor(seed, 1)).toBe(seed >>> 0);
      // Deterministic, and distinct from each other and from the seed.
      expect(boardSeedFor(seed, 2)).toBe(l2);
      expect(boardSeedFor(seed, 3)).toBe(l3);
      expect(l2).not.toBe(l3);
      expect(l2).not.toBe(seed >>> 0);
      expect(l3).not.toBe(seed >>> 0);
    }
  });
});
