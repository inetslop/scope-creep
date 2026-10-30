import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../../src/content/enemies';
import { Rng } from '../../src/core/rng';
import { planWave } from '../../src/core/waves';

/**
 * The quiet (every 4th) wave as it comes out of planWave, the way WaveSystem plays it. The pure
 * halving rules are tested in waves.test.ts.
 */
describe('quiet wave plans', () => {
  it('start with the first spawn at once and keep a non-negative gap between spawns', () => {
    for (const wave of [4, 8, 12, 16, 24, 28]) { // 20 is the boss wave's slot
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      expect(plan.spawns.length).toBeGreaterThanOrEqual(3);
      expect(plan.spawns[0]!.delaySec).toBe(0);
      for (const s of plan.spawns) expect(s.delaySec).toBeGreaterThanOrEqual(0);
    }
  });
});
