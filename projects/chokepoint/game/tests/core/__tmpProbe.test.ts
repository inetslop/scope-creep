import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../../src/content/enemies';
import { Rng } from '../../src/core/rng';
import { planWave, waveCounts } from '../../src/core/waves';

describe('quiet wave preview rows', () => {
  it('a quiet wave plans at least one of each type it shows, and the counts add up to the plan', () => {
    for (const wave of [4, 8, 12, 16, 20, 24]) {
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      const counts = waveCounts(plan);
      expect(counts.every((c) => c.count >= 1)).toBe(true);
      expect(counts.reduce((n, c) => n + c.count, 0)).toBe(plan.spawns.length);
    }
  });
});
