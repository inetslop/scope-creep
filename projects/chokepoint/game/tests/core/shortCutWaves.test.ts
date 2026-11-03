import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../../src/content/enemies';
import { Rng } from '../../src/core/rng';
import { isBossWave, isClumpsWave, isDoubleWave, isQuietWave, isRushWave, isScreenWave, isShortCutWave, isTightWave, planWave, shortCutSpawnDistance, waveHpMul } from '../../src/core/waves';

describe('short cut wave plans', () => {
  it('isShortCutWave: every 9th wave from wave 16, never a quiet, tight, rush or boss wave', () => {
    expect([10, 15, 16, 25, 33, 34, 42, 43, 52, 61, 70, 79, 88, 97].map(isShortCutWave)).toEqual([false, false, false, false, false, true, false, true, false, true, false, true, false, true]);
  });
  it('a short cut wave wears the short cut tag and starts at once with non-negative gaps', () => {
    for (const wave of [34, 43, 61, 79]) { // 16 is the quiet wave's slot, 25 the rush wave's, 52 a quiet wave and 70 the boss wave's
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      expect(plan.tags).toEqual(['short cut']);
      expect(plan.hpMul).toBe(waveHpMul(wave));
      expect(plan.spawns.length).toBeGreaterThan(0);
      expect(plan.spawns[0]!.delaySec).toBe(0);
      for (const s of plan.spawns) expect(s.delaySec).toBeGreaterThanOrEqual(0);
    }
  });
  it('a short cut wave that collides keeps its own tag: quiet at 16, rush at 25, boss at 70, tight at 142', () => {
    expect(planWave(16, new Rng(16), ENEMIES).tags).toEqual(['quiet']);
    expect(planWave(25, new Rng(25), ENEMIES).tags).toEqual(['rush']);
    expect(planWave(70, new Rng(70), ENEMIES).tags).toEqual(['boss']);
    expect(planWave(142, new Rng(142), ENEMIES).tags).toEqual(['tight']);
  });
  it('shortCutSpawnDistance: the entrance always (the far gate), plus 40% of the line left of it on a short cut wave', () => {
    expect(shortCutSpawnDistance(34, 100, 0)).toBeCloseTo(40);
    expect(shortCutSpawnDistance(43, 80, 30)).toBeCloseTo(50); // the far gate: 40% of what is left of the line
    expect(shortCutSpawnDistance(12, 100, 30)).toBe(30); // a plain wave's far gate keeps its own distance (no short cut)
    expect(shortCutSpawnDistance(35, 100, 0)).toBe(0);
    expect(shortCutSpawnDistance(16, 100, 0)).toBe(0); // the quiet wave's slot
    expect(shortCutSpawnDistance(25, 100, 0)).toBe(0); // the rush wave's slot
    expect(shortCutSpawnDistance(20, 100, 0)).toBe(0); // the boss wave
  });
  it('a seeded range: exactly the rule\'s waves carry the short cut tag, one tag at most, every other wave the plain one', () => {
    for (let wave = 1; wave <= 100; wave++) {
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      const want = isBossWave(wave)
        ? ['boss']
        : isQuietWave(wave) ? ['quiet'] : isTightWave(wave) ? ['tight'] : isRushWave(wave) ? ['rush'] : isShortCutWave(wave) ? ['short cut'] : isDoubleWave(wave) ? ['double'] : isClumpsWave(wave) ? ['clumps'] : isScreenWave(wave) ? ['screen'] : [];
      expect(plan.tags, `wave ${wave}`).toEqual(want);
    }
  });
});
