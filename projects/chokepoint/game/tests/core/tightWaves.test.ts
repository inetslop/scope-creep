import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../../src/content/enemies';
import { Rng } from '../../src/core/rng';
import { isTightWave, planWave, tightHalve } from '../../src/core/waves';

describe('tight wave plans', () => {
  it('isTightWave: every 8th wave from wave 6, never a quiet wave', () => {
    expect([0, 1, 4, 5, 6, 8, 12, 14, 22, 30].map(isTightWave)).toEqual([false, false, false, false, true, false, false, true, true, true]);
  });
  it('tightHalve: same enemies in order, first at once, every later gap halved', () => {
    const full = [
      { enemy: 'dot', delaySec: 0 }, { enemy: 'dasher', delaySec: 1 }, { enemy: 'block', delaySec: 1 },
      { enemy: 'dot', delaySec: 2 },
    ];
    expect(tightHalve(full)).toEqual([
      { enemy: 'dot', delaySec: 0 },
      { enemy: 'dasher', delaySec: 0.5 },
      { enemy: 'block', delaySec: 0.5 },
      { enemy: 'dot', delaySec: 1 },
    ]);
  });
  it('a tight wave wears the tight tag and starts at once with non-negative gaps', () => {
    for (const wave of [6, 14, 22]) { // 30 is the boss wave's slot
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      expect(plan.tags).toEqual(['tight']);
      expect(plan.spawns.length).toBeGreaterThan(0);
      expect(plan.spawns[0]!.delaySec).toBe(0);
      for (const s of plan.spawns) expect(s.delaySec).toBeGreaterThanOrEqual(0);
    }
  });
});
