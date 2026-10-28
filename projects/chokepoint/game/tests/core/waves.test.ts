import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../../src/content/enemies';
import { Rng } from '../../src/core/rng';
import { planWave, waveBudget, waveHpMul } from '../../src/core/waves';

describe('planWave', () => {
  it('spends the budget on unlocked enemies only', () => {
    for (let wave = 1; wave <= 30; wave++) {
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      expect(plan.spawns.length).toBeGreaterThan(0);
      let spent = 0;
      for (const s of plan.spawns) {
        const def = ENEMIES.find((e) => e.id === s.enemy)!;
        expect(def.fromWave).toBeLessThanOrEqual(wave);
        expect(s.delaySec).toBeGreaterThanOrEqual(0);
        spent += def.threat;
      }
      expect(spent).toBeLessThanOrEqual(waveBudget(wave));
    }
  });

  it('starts the first spawn at once', () => {
    expect(planWave(1, new Rng(1), ENEMIES).spawns[0]!.delaySec).toBe(0);
  });

  it('gets harder every wave', () => {
    for (let wave = 2; wave <= 40; wave++) {
      expect(waveBudget(wave)).toBeGreaterThan(waveBudget(wave - 1));
      expect(waveHpMul(wave)).toBeGreaterThan(waveHpMul(wave - 1));
    }
    expect(waveHpMul(1)).toBe(1);
  });
});
