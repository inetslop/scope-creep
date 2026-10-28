import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../../src/content/enemies';
import { Rng } from '../../src/core/rng';
import { dashCount, demoWave, planWave, rampCount, waveBudget, waveCounts, waveHpMul } from '../../src/core/waves';

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
        // Splitters and Haulers are mixed in on top of the budget, like the rampers and dashing ones.
        if (s.enemy !== 'splitter' && s.enemy !== 'hauler') spent += def.threat;
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

  it('dashCount: none before wave 5, one on 5, two on 6, +1 every three waves, capped at five', () => {
    expect([4, 5, 6, 9, 12, 15, 20].map((w) => dashCount(w))).toEqual([0, 1, 2, 3, 4, 5, 5]);
  });

  it('mixes in the dashing enemies exactly as dashCount says', () => {
    const expected: [number, number][] = [
      [4, 0],
      [5, 1],
      [6, 2],
      [9, 3],
      [12, 4],
      [15, 5],
      [20, 5],
    ];
    for (const [wave, count] of expected) {
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      expect(plan.spawns.filter((s) => s.enemy === 'dasher').length).toBe(count);
    }
  });

  it('mixes in one splitter per seven of its other enemies, none before wave 9', () => {
    for (const wave of [1, 8]) {
      expect(planWave(wave, new Rng(wave), ENEMIES).spawns.filter((s) => s.enemy === 'splitter').length).toBe(0);
    }
    for (const wave of [9, 12, 15, 20]) {
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      const others = plan.spawns.filter((s) => s.enemy !== 'splitter').length;
      expect(plan.spawns.filter((s) => s.enemy === 'splitter').length).toBe(Math.floor(others / 7));
      expect(plan.spawns.filter((s) => s.enemy === 'splitter').length).toBeGreaterThan(0);
    }
  });

  it('sends exactly one Hauler on 9, 13, 17, ..., walking in with the wave', () => {
    for (let wave = 1; wave <= 30; wave++) {
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      const haulers = plan.spawns.filter((s) => s.enemy === 'hauler').length;
      const expected = wave >= 9 && (wave - 9) % 4 === 0 ? 1 : 0;
      expect(haulers).toBe(expected);
      if (expected === 1) expect(plan.spawns.some((s) => s.enemy !== 'hauler')).toBe(true); // never a Hauler-only wave
    }
  });

  it('never sends a wave made only of dashing enemies', () => {
    for (let wave = 5; wave <= 30; wave++) {
      expect(planWave(wave, new Rng(wave), ENEMIES).spawns.some((s) => s.enemy !== 'dasher')).toBe(true);
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

describe('demoWave', () => {
  it('plays the saved best wave, at least 1 (a first-time player gets wave 1)', () => {
    expect(demoWave(0)).toBe(1);
    expect(demoWave(1)).toBe(1);
    expect(demoWave(12)).toBe(12);
  });
});

describe('waveCounts', () => {
  it('lists each type the wave sends, once, in first-arrival order', () => {
    for (const seed of [1, 7, 42]) {
      for (let wave = 1; wave <= 20; wave++) {
        const plan = planWave(wave, new Rng(seed * 100 + wave), ENEMIES);
        const counts = waveCounts(plan);
        expect(counts.reduce((n, c) => n + c.count, 0)).toBe(plan.spawns.length);
        const firstSeen: string[] = [];
        for (const s of plan.spawns) if (!firstSeen.includes(s.enemy)) firstSeen.push(s.enemy);
        expect(counts.map((c) => c.id)).toEqual(firstSeen);
        for (const c of counts) expect(c.count).toBeGreaterThan(0);
      }
    }
  });
});
