import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../../src/content/enemies';
import { Rng } from '../../src/core/rng';
import { planWave, rampCount, waveBudget, waveHpMul } from '../../src/core/waves';

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

  it('rampCount: none before wave 8, two from 8, +1 every four waves, capped at six', () => {
    expect([7, 8, 12, 16, 20, 24, 40].map((w) => rampCount(w))).toEqual([0, 2, 3, 4, 5, 6, 6]);
  });

  it('mixes in the ramping enemies exactly as rampCount says', () => {
    const expected: [number, number][] = [
      [1, 0],
      [7, 0],
      [8, 2],
      [12, 3],
      [16, 4],
      [20, 5],
      [24, 6],
      [30, 6],
    ];
    for (const [wave, count] of expected) {
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      expect(plan.spawns.filter((s) => s.enemy === 'sprinter').length).toBe(count);
    }
  });

  it('gets harder every wave', () => {
    for (let wave = 2; wave <= 40; wave++) {
      expect(waveBudget(wave)).toBeGreaterThan(waveBudget(wave - 1));
      expect(waveHpMul(wave)).toBeGreaterThan(waveHpMul(wave - 1));
    }
    expect(waveHpMul(1)).toBe(1);
  });
});
