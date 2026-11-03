import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../../src/content/enemies';
import { Rng } from '../../src/core/rng';
import {
  SCREEN_WINDOW_SEC,
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
  screenFront,
  waveHpMul,
  type WavePlan,
} from '../../src/core/waves';

function dots(count: number, number: number): WavePlan {
  return { number, spawns: Array.from({ length: count }, (_, i) => ({ enemy: 'dot', delaySec: i === 0 ? 0 : 1 })), hpMul: 1, tags: ['screen'] };
}

describe('screen wave plans', () => {
  it('isScreenWave: every 11th wave from wave 18, never a quiet, tight, rush, short cut, double, clumps or boss wave', () => {
    // 18 is the rush wave's slot, 29 the double's and 40 the boss's, 62 tight, 84 quiet, 95 the rush's, 106 the short cut's and 117 the double's
    expect([17, 18, 28, 29, 39, 40, 50, 51, 61, 62, 72, 73, 83, 84, 94, 95, 105, 106, 116, 117].map(isScreenWave)).toEqual([false, false, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false, false, false, false]);
  });
  it('a screen wave wears the screen tag, starts at once and has non-negative gaps', () => {
    for (const wave of [51, 73]) {
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      expect(plan.tags, `wave ${wave}`).toEqual(['screen']);
      expect(plan.hpMul).toBe(waveHpMul(wave));
      expect(plan.spawns.length).toBeGreaterThan(1);
      expect(plan.spawns[0]!.delaySec).toBe(0);
      for (const s of plan.spawns) expect(s.delaySec).toBeGreaterThanOrEqual(0);
      // The plan as planned keeps the wave's normal spawn span; the front is cut by the WaveSystem, after the level's extras.
      let span = 0;
      for (const s of plan.spawns) span += s.delaySec;
      expect(span, `wave ${wave}`).toBeGreaterThan(SCREEN_WINDOW_SEC);
    }
  });
  it('a screen wave that collides keeps its own tag: rush at 18 and 95, double at 29 and 117, boss at 40, tight at 62, quiet at 84, short cut at 106', () => {
    expect(planWave(18, new Rng(18), ENEMIES).tags).toEqual(['rush']);
    expect(planWave(29, new Rng(29), ENEMIES).tags).toEqual(['double']);
    expect(planWave(40, new Rng(40), ENEMIES).tags).toEqual(['boss']);
    expect(planWave(62, new Rng(62), ENEMIES).tags).toEqual(['tight']);
    expect(planWave(84, new Rng(84), ENEMIES).tags).toEqual(['quiet']);
    expect(planWave(95, new Rng(95), ENEMIES).tags).toEqual(['rush']);
    expect(planWave(106, new Rng(106), ENEMIES).tags).toEqual(['short cut']);
    expect(planWave(117, new Rng(117), ENEMIES).tags).toEqual(['double']);
  });
  it('screenFront: the whole spawn span rescales to the window, the first spawn stays at once, the order kept', () => {
    const ten = dots(10, 51); // ten dots, 1 s gaps: span 9 s
    const front = screenFront(ten);
    expect(front.spawns.map((s) => s.delaySec)).toEqual([0, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6]);
    expect(front.spawns.map((s) => s.enemy)).toEqual(ten.spawns.map((s) => s.enemy));
    let t = 0;
    for (const s of front.spawns) {
      t += s.delaySec;
      expect(t).toBeLessThanOrEqual(SCREEN_WINDOW_SEC + 1e-9);
    }
    expect(t).toBeCloseTo(1.5, 9);
    const one = dots(1, 51);
    expect(screenFront(one)).toBe(one); // a one-spawn plan comes back unchanged
  });
  it('the window is exactly SCREEN_WINDOW_SEC', () => {
    expect(SCREEN_WINDOW_SEC).toBe(1.5);
  });
  it("a seeded range: exactly the rule's waves carry the screen tag, one tag at most, every screen plan fits its window after screenFront", () => {
    for (let wave = 1; wave <= 100; wave++) {
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      const want = isBossWave(wave)
        ? ['boss']
        : isQuietWave(wave) ? ['quiet'] : isTightWave(wave) ? ['tight'] : isRushWave(wave) ? ['rush'] : isShortCutWave(wave) ? ['short cut'] : isDoubleWave(wave) ? ['double'] : isClumpsWave(wave) ? ['clumps'] : isScreenWave(wave) ? ['screen'] : isScatterWave(wave) ? ['scatter'] : [];
      expect(plan.tags, `wave ${wave}`).toEqual(want);
      expect(plan.tags.length, `wave ${wave}`).toBeLessThanOrEqual(1);
      if (isScreenWave(wave)) {
        let t = 0;
        for (const s of screenFront(plan).spawns) {
          t += s.delaySec;
          expect(t, `wave ${wave}`).toBeLessThanOrEqual(SCREEN_WINDOW_SEC + 1e-9);
        }
      }
    }
  });
});
