import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../../src/content/enemies';
import { Rng } from '../../src/core/rng';
import { levelSpeedMul } from '../../src/core/levels';
import { isRushWave, planWave, waveSpeedMul } from '../../src/core/waves';

describe('rush wave plans', () => {
  it('isRushWave: every 7th wave from wave 11, never a quiet, tight or boss wave', () => {
    expect([5, 10, 11, 17, 18, 24, 25, 32, 39, 46, 53, 60].map(isRushWave)).toEqual([false, false, true, false, true, false, true, false, true, false, true, false]);
  });
  it('waveSpeedMul: 1.5 on a rush wave, 1 otherwise, and it stacks with the level\'s Swift (1.15 × 1.5 = 1.725)', () => {
    expect(waveSpeedMul(11)).toBe(1.5);
    expect(waveSpeedMul(12)).toBe(1);
    expect(levelSpeedMul(['swift']) * waveSpeedMul(11)).toBeCloseTo(1.725);
  });
  it('a rush wave wears the rush tag and starts at once with non-negative gaps', () => {
    for (const wave of [11, 18, 25, 39]) { // 46 is the tight wave's slot, 60 the boss wave's
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      expect(plan.tags).toEqual(['rush']);
      expect(plan.spawns.length).toBeGreaterThan(0);
      expect(plan.spawns[0]!.delaySec).toBe(0);
      for (const s of plan.spawns) expect(s.delaySec).toBeGreaterThanOrEqual(0);
    }
  });
  it('a rush wave that collides keeps its own tag: quiet at 32, tight at 46, boss at 60', () => {
    expect(planWave(32, new Rng(32), ENEMIES).tags).toEqual(['quiet']);
    expect(planWave(46, new Rng(46), ENEMIES).tags).toEqual(['tight']);
    expect(planWave(60, new Rng(60), ENEMIES).tags).toEqual(['boss']);
  });
});
