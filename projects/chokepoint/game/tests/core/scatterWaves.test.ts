import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../../src/content/enemies';
import { Rng } from '../../src/core/rng';
import { isBossWave, isClumpsWave, isDoubleWave, isQuietWave, isRushWave, isScatterWave, isScreenWave, isShortCutWave, isTightWave, planWave, scatterSpawnDistance, waveHpMul } from '../../src/core/waves';

describe('scatter wave plans', () => {
  it('isScatterWave: every 9th wave from wave 19, never a quiet, tight, rush, short cut, double, clumps, screen or boss wave', () => {
    expect([18, 19, 27, 28, 36, 37, 45, 46, 54, 55, 63, 64, 72, 73, 81, 82, 90, 91, 99, 100, 108, 109].map(isScatterWave)).toEqual([false, true, false, false, false, false, false, false, false, true, false, false, false, false, false, true, false, true, false, false, false, false]);
  });
  it('a scatter wave wears the scatter tag and starts at once with non-negative gaps', () => {
    for (const wave of [19, 55, 82, 91]) {
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      expect(plan.tags).toEqual(['scatter']);
      expect(plan.hpMul).toBe(waveHpMul(wave));
      expect(plan.spawns.length).toBeGreaterThan(0);
      expect(plan.spawns[0]!.delaySec).toBe(0);
      for (const s of plan.spawns) expect(s.delaySec).toBeGreaterThanOrEqual(0);
    }
  });
  it('a scatter wave that collides keeps its own tag: quiet at 28 and 64, double at 37, tight at 46, screen at 73, boss at 100, rush at 109', () => {
    expect(planWave(28, new Rng(28), ENEMIES).tags).toEqual(['quiet']);
    expect(planWave(37, new Rng(37), ENEMIES).tags).toEqual(['double']);
    expect(planWave(46, new Rng(46), ENEMIES).tags).toEqual(['tight']);
    expect(planWave(64, new Rng(64), ENEMIES).tags).toEqual(['quiet']);
    expect(planWave(73, new Rng(73), ENEMIES).tags).toEqual(['screen']);
    expect(planWave(100, new Rng(100), ENEMIES).tags).toEqual(['boss']);
    expect(planWave(109, new Rng(109), ENEMIES).tags).toEqual(['rush']);
  });
  it('scatterSpawnDistance: the entrance always (the far gate), plus a 15–55% roll of the line left of it on a scatter wave', () => {
    const d = scatterSpawnDistance(55, new Rng(1), 100, 0);
    expect(d).toBeGreaterThanOrEqual(15);
    expect(d).toBeLessThan(55); // 15–55%, never at the gate, never past the roll's top
    expect(scatterSpawnDistance(55, new Rng(1), 100, 0)).toBe(d); // the same seed scatters to the same point
    const far = scatterSpawnDistance(82, new Rng(2), 80, 30);
    expect(far).toBeGreaterThanOrEqual(37.5); // the far gate: 15–55% of what is left of the line
    expect(far).toBeLessThan(57.5);
    expect(scatterSpawnDistance(34, new Rng(3), 100, 30)).toBe(30); // a plain wave keeps its own distance (no scatter)
    const a = new Rng(7);
    const b = new Rng(7);
    expect(scatterSpawnDistance(34, a, 100, 30)).toBe(30); // a non-scatter wave rolls nothing
    expect(a.next()).toBe(b.next()); // and leaves a twin seeded Rng's stream untouched
  });
  it("a seeded range: exactly the rule's waves carry the scatter tag, one tag at most, every other wave the plain one", () => {
    for (let wave = 1; wave <= 100; wave++) {
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      const want = isBossWave(wave)
        ? ['boss']
        : isQuietWave(wave) ? ['quiet'] : isTightWave(wave) ? ['tight'] : isRushWave(wave) ? ['rush'] : isShortCutWave(wave) ? ['short cut'] : isDoubleWave(wave) ? ['double'] : isClumpsWave(wave) ? ['clumps'] : isScreenWave(wave) ? ['screen'] : isScatterWave(wave) ? ['scatter'] : [];
      expect(plan.tags, `wave ${wave}`).toEqual(want);
    }
  });
});
