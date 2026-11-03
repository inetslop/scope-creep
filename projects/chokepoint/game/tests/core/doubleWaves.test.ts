import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../../src/content/enemies';
import { Rng } from '../../src/core/rng';
import {
  DOUBLE_LULL_SEC,
  DOUBLE_SPEED_MUL,
  doubleLull,
  doubleSplitAt,
  isBossWave,
  isClumpsWave,
  isDoubleWave,
  isQuietWave,
  isRushWave,
  isScatterWave,
  isScreenWave,
  isShortCutWave,
  isTightWave,
  planWave,
  waveHpMul,
  type WavePlan,
} from '../../src/core/waves';

describe('double wave plans', () => {
  it('isDoubleWave: every 8th wave from wave 21, never a quiet, tight, rush, short cut or boss wave', () => {
    expect([19, 20, 21, 29, 37, 45, 52, 53, 60, 61, 69, 77, 85, 93].map(isDoubleWave)).toEqual([false, false, true, true, true, true, false, false, false, false, true, true, true, true]);
  });
  it('a double wave wears the double tag, starts at once and has non-negative gaps', () => {
    for (const wave of [21, 29, 37, 45, 69, 77, 85, 93]) { // 53 is the rush wave's slot, 61 the short cut's
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      expect(plan.tags, `wave ${wave}`).toEqual(['double']);
      expect(plan.hpMul).toBe(waveHpMul(wave));
      expect(plan.spawns.length).toBeGreaterThan(1);
      expect(plan.spawns[0]!.delaySec).toBe(0);
      for (const s of plan.spawns) expect(s.delaySec).toBeGreaterThanOrEqual(0);
    }
  });
  it('a double wave that collides keeps its own tag: rush at 53, short cut at 61, boss at 60', () => {
    expect(planWave(53, new Rng(53), ENEMIES).tags).toEqual(['rush']);
    expect(planWave(61, new Rng(61), ENEMIES).tags).toEqual(['short cut']);
    expect(planWave(60, new Rng(60), ENEMIES).tags).toEqual(['boss']);
  });
  it('doubleLull: the split spawn\'s gap is replaced by the lull, order and every other gap kept', () => {
    const five: WavePlan = { number: 21, spawns: [{ enemy: 'dot', delaySec: 0 }, { enemy: 'dot', delaySec: 1 }, { enemy: 'dot', delaySec: 2 }, { enemy: 'dot', delaySec: 3 }, { enemy: 'dot', delaySec: 4 }], hpMul: 1, tags: ['double'] };
    const lulled = doubleLull(five);
    expect(doubleSplitAt(5)).toBe(3);
    expect(lulled.spawns.map((s) => s.delaySec)).toEqual([0, 1, 2, DOUBLE_LULL_SEC, 4]);
    expect(lulled.spawns.map((s) => s.enemy)).toEqual(five.spawns.map((s) => s.enemy));
    const four: WavePlan = { number: 29, spawns: [{ enemy: 'dot', delaySec: 0 }, { enemy: 'dot', delaySec: 1 }, { enemy: 'dot', delaySec: 2 }, { enemy: 'dot', delaySec: 3 }], hpMul: 1, tags: ['double'] };
    expect(doubleSplitAt(4)).toBe(2);
    expect(doubleLull(four).spawns.map((s) => s.delaySec)).toEqual([0, 1, DOUBLE_LULL_SEC, 3]);
  });
  it('the lull is exactly DOUBLE_LULL_SEC, and the second front\'s walkers walk DOUBLE_SPEED_MUL faster', () => {
    expect(DOUBLE_LULL_SEC).toBe(6);
    expect(DOUBLE_SPEED_MUL).toBe(1.2);
    expect(0.9 * DOUBLE_SPEED_MUL).toBeCloseTo(1.08); // the thin road's 10% slow still applies to the second front
  });
  it("a seeded range: exactly the rule's waves carry the double tag, one tag at most, no boss wave double", () => {
    for (let wave = 1; wave <= 100; wave++) {
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      const want = isBossWave(wave)
        ? ['boss']
        : isQuietWave(wave) ? ['quiet'] : isTightWave(wave) ? ['tight'] : isRushWave(wave) ? ['rush'] : isShortCutWave(wave) ? ['short cut'] : isDoubleWave(wave) ? ['double'] : isClumpsWave(wave) ? ['clumps'] : isScreenWave(wave) ? ['screen'] : isScatterWave(wave) ? ['scatter'] : [];
      expect(plan.tags, `wave ${wave}`).toEqual(want);
      expect(plan.tags.length, `wave ${wave}`).toBeLessThanOrEqual(1);
      if (isBossWave(wave)) expect(plan.tags, `wave ${wave}`).not.toEqual(['double']);
    }
  });
});
