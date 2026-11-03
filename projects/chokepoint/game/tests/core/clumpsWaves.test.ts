import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../../src/content/enemies';
import { Rng } from '../../src/core/rng';
import {
  CLUMPS_GAP_SEC,
  clumpBoundaries,
  clumpsGap,
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

function dots(count: number, number: number): WavePlan {
  return { number, spawns: Array.from({ length: count }, (_, i) => ({ enemy: 'dot', delaySec: i === 0 ? 0 : 1 })), hpMul: 1, tags: ['clumps'] };
}

describe('clumps wave plans', () => {
  it('isClumpsWave: every 11th wave from wave 26, never a quiet, tight, rush, short cut, double or boss wave', () => {
    // 37 is the double wave's slot, 48 and 92 quiet waves, 70 the boss wave's and 81 a rush wave
    expect([24, 25, 26, 36, 37, 47, 48, 58, 59, 69, 70, 80, 81, 91, 92, 102, 103].map(isClumpsWave)).toEqual([false, false, true, false, false, false, false, false, true, false, false, false, false, false, false, false, true]);
  });
  it('a clumps wave wears the clumps tag, starts at once and has non-negative gaps', () => {
    for (const wave of [26, 59]) {
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      expect(plan.tags, `wave ${wave}`).toEqual(['clumps']);
      expect(plan.hpMul).toBe(waveHpMul(wave));
      expect(plan.spawns.length).toBeGreaterThan(1);
      expect(plan.spawns[0]!.delaySec).toBe(0);
      for (const s of plan.spawns) expect(s.delaySec).toBeGreaterThanOrEqual(0);
    }
  });
  it('a clumps wave that collides keeps its own tag: double at 37, quiet at 48 and 92, boss at 70, rush at 81', () => {
    expect(planWave(37, new Rng(37), ENEMIES).tags).toEqual(['double']);
    expect(planWave(48, new Rng(48), ENEMIES).tags).toEqual(['quiet']);
    expect(planWave(70, new Rng(70), ENEMIES).tags).toEqual(['boss']);
    expect(planWave(81, new Rng(81), ENEMIES).tags).toEqual(['rush']);
    expect(planWave(92, new Rng(92), ENEMIES).tags).toEqual(['quiet']);
  });
  it('clumpsGap: the clump-boundary gaps are replaced by the gap, the order and every other gap kept', () => {
    expect(clumpBoundaries(10)).toEqual([2, 5, 7]);
    expect(clumpsGap(dots(10, 26)).spawns.map((s) => s.delaySec)).toEqual([0, 1, 4, 1, 1, 4, 1, 4, 1, 1]);
    expect(clumpsGap(dots(7, 59)).spawns.map((s) => s.delaySec)).toEqual([0, 1, 4, 1, 1, 4, 1]);
    expect(clumpsGap(dots(4, 26)).spawns.map((s) => s.delaySec)).toEqual([0, 1, 4, 1]);
    expect(clumpsGap(dots(3, 26)).spawns.map((s) => s.delaySec)).toEqual([0, 1, 4]); // clumps of 2 and 1
    const ten = dots(10, 26);
    expect(clumpsGap(ten).spawns.map((s) => s.enemy)).toEqual(ten.spawns.map((s) => s.enemy));
  });
  it('the gap is exactly CLUMPS_GAP_SEC of simulation time', () => {
    expect(CLUMPS_GAP_SEC).toBe(4);
  });
  it("a seeded range: exactly the rule's waves carry the clumps tag, one tag at most, no boss wave clumps, every clumps plan keeps its gaps", () => {
    for (let wave = 1; wave <= 100; wave++) {
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      const want = isBossWave(wave)
        ? ['boss']
        : isQuietWave(wave) ? ['quiet'] : isTightWave(wave) ? ['tight'] : isRushWave(wave) ? ['rush'] : isShortCutWave(wave) ? ['short cut'] : isDoubleWave(wave) ? ['double'] : isClumpsWave(wave) ? ['clumps'] : isScreenWave(wave) ? ['screen'] : isScatterWave(wave) ? ['scatter'] : [];
      expect(plan.tags, `wave ${wave}`).toEqual(want);
      expect(plan.tags.length, `wave ${wave}`).toBeLessThanOrEqual(1);
      if (isBossWave(wave)) expect(plan.tags, `wave ${wave}`).not.toEqual(['clumps']);
      // The gaps land where the WaveSystem cuts them (after the level's extras, like the double's lull).
      if (isClumpsWave(wave)) {
        const shaped = clumpsGap(plan);
        const at = new Set(clumpBoundaries(shaped.spawns.length));
        for (const i of at) expect(shaped.spawns[i]!.delaySec, `wave ${wave} spawn ${i}`).toBe(CLUMPS_GAP_SEC);
      }
    }
  });
});
