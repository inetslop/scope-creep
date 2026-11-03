import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../../src/content/enemies';
import { getLevelAugment } from '../../src/content/levels';
import { levelMultiplier, levelMultiplierLabel } from '../../src/core/levels';
import { Rng } from '../../src/core/rng';
import {
  CLUMPS_GAP_SEC,
  clumpBoundaries,
  clumpsLevelPlan,
  isBossWave,
  isQuietWave,
  isTightWave,
  planWave,
  planWithLevel,
  waveHpMul,
} from '../../src/core/waves';

/** The wave's own number-based march tags: none of them fires in a Clumps run (the level chip says the march). */
const MARCH = ['tight', 'rush', 'short cut', 'double', 'clumps', 'screen', 'scatter'];

describe('the Clumps level (content/levels/clumps.ts)', () => {
  it("the level's card: its name, its one-liner and the set's current ×1.40 notch", () => {
    expect(getLevelAugment('clumps')).toMatchObject({ name: 'Clumps', line: 'every wave comes in clumps', bonus: 0.4 });
    expect(levelMultiplier(['clumps'])).toBeCloseTo(1.4, 12);
    expect(levelMultiplierLabel(['clumps'])).toBe('×1.40');
  });

  it('waves 1–100 of a Clumps run: the quiet breather keeps its quiet tag, the boss its own, and no number-based march tag anywhere', () => {
    for (let w = 1; w <= 100; w++) {
      const plan = planWave(w, new Rng(w), ENEMIES, true);
      expect(plan.tags, `wave ${w}`).toEqual(isBossWave(w) ? ['boss'] : isQuietWave(w) ? ['quiet'] : []);
      expect(plan.tags.some((t) => MARCH.includes(t)), `wave ${w}`).toBe(false);
    }
  });

  it("every non-quiet, non-boss wave of the run: no tag, the same enemies and the wave's own hp as the plain run, and the 4 s gaps at its clump boundaries", () => {
    for (let w = 1; w <= 100; w++) {
      if (isQuietWave(w) || isBossWave(w)) continue;
      const shaped = clumpsLevelPlan(planWave(w, new Rng(w), ENEMIES, true));
      const plain = planWave(w, new Rng(w), ENEMIES);
      expect(shaped.tags, `wave ${w}`).toEqual([]);
      expect(shaped.spawns.map((s) => s.enemy), `wave ${w}`).toEqual(plain.spawns.map((s) => s.enemy));
      expect(shaped.hpMul, `wave ${w}`).toBe(waveHpMul(w));
      for (const i of clumpBoundaries(shaped.spawns.length)) expect(shaped.spawns[i]!.delaySec, `wave ${w} spawn ${i}`).toBe(CLUMPS_GAP_SEC);
    }
  });

  it("the run's tight waves 6, 14 and 22 never bunch: no tag, every gap exactly twice the normal tight plan's", () => {
    for (const w of [6, 14, 22]) {
      expect(isTightWave(w)).toBe(true);
      const plan = planWave(w, new Rng(w), ENEMIES, true);
      const tight = planWave(w, new Rng(w), ENEMIES);
      expect(tight.tags, `wave ${w}`).toEqual(['tight']);
      expect(plan.tags, `wave ${w}`).toEqual([]);
      expect(plan.spawns, `wave ${w}`).toHaveLength(tight.spawns.length);
      for (let i = 1; i < plan.spawns.length; i++) expect(plan.spawns[i]!.delaySec, `wave ${w} spawn ${i}`).toBe(tight.spawns[i]!.delaySec * 2);
    }
  });

  it("the run's quiet 4 and 8 and boss 10, 20 and 40 keep their own plans: the same plan object, the quiet tag, the boss's own spawns", () => {
    for (const w of [4, 8]) {
      const plan = planWave(w, new Rng(w), ENEMIES, true);
      expect(clumpsLevelPlan(plan), `wave ${w}`).toBe(plan);
      expect(plan.tags, `wave ${w}`).toEqual(['quiet']);
    }
    for (const w of [10, 20, 40]) {
      const plan = planWave(w, new Rng(w), ENEMIES, true);
      expect(clumpsLevelPlan(plan), `wave ${w}`).toBe(plan);
      expect(plan.spawns, `wave ${w}`).toEqual(planWave(w, new Rng(w), ENEMIES).spawns);
    }
  });

  it("with Crowded's extras on, the level still cuts its 4 s gaps at the shaped plan's own clump boundaries", () => {
    const shaped = clumpsLevelPlan(planWithLevel(planWave(7, new Rng(7), ENEMIES, true), 1.2));
    expect(shaped.tags).toEqual([]);
    for (const i of clumpBoundaries(shaped.spawns.length)) expect(shaped.spawns[i]!.delaySec, `spawn ${i}`).toBe(CLUMPS_GAP_SEC);
  });

  it("a run without the level is byte-identical: the defaulted 4th argument plans exactly today's waves 1–100", () => {
    for (let w = 1; w <= 100; w++) {
      expect(planWave(w, new Rng(w), ENEMIES, false), `wave ${w}`).toEqual(planWave(w, new Rng(w), ENEMIES));
    }
  });
});
