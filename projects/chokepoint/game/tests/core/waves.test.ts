import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../../src/content/enemies';
import { Rng } from '../../src/core/rng';
import { bossId, dashCount, demoWave, isBossWave, isQuietWave, planWave, quietCount, quietGoldMul, quietHalve, rampCount, waveBudget, waveCounts, waveHpMul } from '../../src/core/waves';

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
        if (s.enemy !== 'splitter' && s.enemy !== 'hauler' && s.enemy !== 'mute' && s.enemy !== 'bulwark' && s.enemy !== 'ward') spent += def.threat;
      }
      expect(spent).toBeLessThanOrEqual(waveBudget(wave));
    }
  });

  it('starts the first spawn at once', () => {
    expect(planWave(1, new Rng(1), ENEMIES).spawns[0]!.delaySec).toBe(0);
  });

  it('carries its tags: quiet waves are quiet, every other wave has none', () => {
    expect(planWave(8, new Rng(8), ENEMIES).tags).toEqual(['quiet']);
    expect(planWave(5, new Rng(5), ENEMIES).tags).toEqual([]);
  });

  it('boss waves carry the boss tag', () => {
    expect(planWave(10, new Rng(10), ENEMIES).tags).toEqual(['boss']);
  });

  it('rampCount: none before wave 8, two from 8, +1 every four waves, capped at six', () => {
    expect([7, 8, 12, 16, 20, 24, 40].map((w) => rampCount(w))).toEqual([0, 2, 3, 4, 5, 6, 6]);
  });

  it('mixes in the ramping enemies exactly as rampCount says (non-quiet waves; quiet waves are halved)', () => {
    const expected: [number, number][] = [
      [1, 0],
      [7, 0],
      [9, 2],
      [13, 3],
      [17, 4],
      [21, 5],
      [25, 6],
    ]; // 30 is the boss wave's slot, so its plan has no rampers to count
    for (const [wave, count] of expected) {
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      expect(plan.spawns.filter((s) => s.enemy === 'sprinter').length).toBe(count);
    }
  });

  it('dashCount: none before wave 5, one on 5, two on 6, +1 every three waves, capped at five', () => {
    expect([4, 5, 6, 9, 12, 15, 20].map((w) => dashCount(w))).toEqual([0, 1, 2, 3, 4, 5, 5]);
  });

  it('mixes in the dashing enemies exactly as dashCount says (non-quiet waves; quiet waves are halved)', () => {
    const expected: [number, number][] = [
      [4, 0],
      [5, 1],
      [6, 2],
      [9, 3],
      [13, 4],
      [15, 5],
      [21, 5],
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
    for (const wave of [9, 13, 15, 21]) { // non-quiet: a quiet wave halves the plan
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      // The Hauler is reserved after the splitters are counted, so it doesn't count toward them.
      const others = plan.spawns.filter((s) => s.enemy !== 'splitter' && s.enemy !== 'hauler').length;
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

  it('sends exactly one Mute on 11, 14, 17, ... — a quiet wave keeps it', () => {
    for (let wave = 1; wave <= 30; wave++) {
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      const expected = wave >= 11 && (wave - 11) % 3 === 0 && wave % 10 !== 0 ? 1 : 0; // a boss wave sends only its Colossus
      expect(plan.spawns.filter((s) => s.enemy === 'mute').length).toBe(expected);
      if (expected === 1) expect(plan.spawns.some((s) => s.enemy !== 'mute')).toBe(true); // never a Mute-only wave
    }
  });

  it('sends exactly one Bulwark on 12, 16, 20, ... — a quiet wave keeps it', () => {
    for (let wave = 1; wave <= 30; wave++) {
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      const expected = wave >= 12 && (wave - 12) % 4 === 0 && wave % 10 !== 0 ? 1 : 0; // a boss wave sends only its Colossus
      expect(plan.spawns.filter((s) => s.enemy === 'bulwark').length).toBe(expected);
      if (expected === 1) expect(plan.spawns.some((s) => s.enemy !== 'bulwark')).toBe(true); // never a Bulwark-only wave
    }
  });

  it('sends exactly one Ward on 15, 25, 35, ... — a boss wave takes its slot, a quiet wave keeps it', () => {
    for (let wave = 1; wave <= 40; wave++) {
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      const expected = wave >= 15 && wave % 5 === 0 && wave % 10 !== 0 ? 1 : 0; // a boss wave sends only its Colossus
      expect(plan.spawns.filter((s) => s.enemy === 'ward').length).toBe(expected);
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

describe('boss waves (every 10th)', () => {
  it('isBossWave: every 10th wave, not wave 0', () => {
    expect([0, 1, 9, 10, 11, 19, 20, 30, 40].map(isBossWave)).toEqual([false, false, false, true, false, false, true, true, true]);
  });
  it('bossId: the boss the plan declares, undefined off the boss waves', () => {
    expect(bossId(10)).toBe('colossus');
    expect(bossId(30)).toBe('orb');
    expect(bossId(1)).toBeUndefined();
    expect(bossId(9)).toBeUndefined();
    for (const wave of [10, 20, 30, 40]) {
      expect(bossId(wave)).toBe(planWave(wave, new Rng(wave), ENEMIES).spawns[0]!.enemy); // the rule and the plan agree
    }
  });
  it('a boss wave is exactly one boss — the Colossus, the Orb on wave 30 — nothing else: the boss tag, the wave-scaled hp', () => {
    for (const wave of [10, 20, 30, 40]) {
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      expect(plan.spawns).toEqual([{ enemy: wave === 30 ? 'orb' : 'colossus', delaySec: 0 }]);
      expect(plan.tags).toEqual(['boss']);
      expect(plan.hpMul).toBe(waveHpMul(wave));
    }
  });
  it('non-boss waves never send a Colossus', () => {
    for (let wave = 1; wave <= 40; wave++) {
      if (wave % 10 === 0) continue;
      expect(planWave(wave, new Rng(wave), ENEMIES).spawns.some((s) => s.enemy === 'colossus')).toBe(false);
    }
  });
  it('non-boss waves never send the Orb or a Shard (the Orb is the wave-30 boss; the Shard only splits from it)', () => {
    for (let wave = 1; wave <= 40; wave++) {
      if (wave % 10 === 0) continue;
      expect(planWave(wave, new Rng(wave), ENEMIES).spawns.some((s) => s.enemy === 'orb' || s.enemy === 'shard')).toBe(false);
    }
  });
  it('the boss plan is the same on every rng stream (no draws of its own)', () => {
    for (const seed of [1, 7, 42]) {
      expect(planWave(10, new Rng(seed), ENEMIES).spawns).toEqual([{ enemy: 'colossus', delaySec: 0 }]);
      expect(planWave(30, new Rng(seed), ENEMIES).spawns).toEqual([{ enemy: 'orb', delaySec: 0 }]);
    }
  });
});

describe('quiet waves (every 4th)', () => {
  it('isQuietWave: every 4th wave, not wave 0', () => {
    expect([0,1,2,3,4,5,8,12].map(isQuietWave)).toEqual([false,false,false,false,true,false,true,true]);
  });
  it('quietGoldMul: double on quiet waves, 1 otherwise', () => {
    expect([1,3,4,5,8,12].map(quietGoldMul)).toEqual([1,1,2,1,2,2]);
  });
  it('quietCount: half rounded up, minimum 3', () => {
    expect([2,3,4,5,6,7,8,10].map(quietCount)).toEqual([3,3,3,3,3,4,4,5]);
  });
  it('quietHalve: keeps every other spawn, same types, delays take on the gaps', () => {
    const full = [
      { enemy: 'dot', delaySec: 0 }, { enemy: 'dasher', delaySec: 1 }, { enemy: 'block', delaySec: 1 },
      { enemy: 'dot', delaySec: 1 }, { enemy: 'dasher', delaySec: 1 },
    ];
    expect(quietHalve(full)).toEqual([
      { enemy: 'dot', delaySec: 0 },
      { enemy: 'block', delaySec: 2 }, // own 1 + the dropped dasher's 1
      { enemy: 'dasher', delaySec: 2 },
    ]);
    expect(quietHalve(full.slice(0, 4))).toEqual([ // ceil(4/2)=2 < 3, the min-3 floor wins
      { enemy: 'dot', delaySec: 0 }, { enemy: 'dasher', delaySec: 1 }, { enemy: 'block', delaySec: 1 },
    ]);
  });
  it('a quiet wave sends between 3 and half the usual budget, deterministically', () => {
    for (const wave of [4, 8, 12, 16, 24]) { // 20 is the boss's slot
      const a = planWave(wave, new Rng(wave), ENEMIES);
      expect(a.spawns).toEqual(planWave(wave, new Rng(wave), ENEMIES).spawns); // no rng in the halving
      expect(a.spawns.length).toBeGreaterThanOrEqual(3);
      expect(a.spawns.filter((s) => s.enemy !== 'mute' && s.enemy !== 'bulwark').length).toBeLessThanOrEqual(Math.ceil(waveBudget(wave) / 2)); // the Mute and Bulwark ride on top of the halved plan
    }
  });
  it('non-quiet waves are not halved', () => {
    for (const wave of [1, 2, 3, 5, 6, 7, 9, 10, 11, 13]) {
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      expect(plan.spawns.length).toBeGreaterThan(0);
      expect(plan.spawns.length).toBeLessThanOrEqual(waveBudget(wave)); // the whole budget is fair game
    }
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
