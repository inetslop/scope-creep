import { describe, expect, it } from 'vitest';
import { coinsForRun, loadProfile, recordRun, saveLevelOn, saveSound, type KeyValueStore } from '../../src/core/profile';

const memory = (): KeyValueStore => {
  const data = new Map<string, string>();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};

describe('profile', () => {
  it('coins are the waves held, plus a coin per ten stopped, plus the clean waves', () => {
    expect(coinsForRun({ waves: 12, stopped: 148, clean: 5, seed: 1, bgen: 2 })).toBe(31);
    expect(coinsForRun({ waves: 0, stopped: 0, clean: 0, seed: 1, bgen: 2 })).toBe(0);
    expect(coinsForRun({ waves: 0, stopped: 19, clean: 0, seed: 1, bgen: 2 })).toBe(1);
    expect(coinsForRun({ waves: 0, stopped: 20, clean: 0, seed: 1, bgen: 2 })).toBe(2);
  });

  it('the claim node doubles the clean term: clean waves pay two coins each', () => {
    expect(coinsForRun({ waves: 0, stopped: 0, clean: 0, seed: 1, bgen: 2 }, 2)).toBe(0);
    expect(coinsForRun({ waves: 0, stopped: 0, clean: 1, seed: 1, bgen: 2 }, 2)).toBe(2);
    expect(coinsForRun({ waves: 0, stopped: 0, clean: 4, seed: 1, bgen: 2 }, 2)).toBe(8);
    expect(coinsForRun({ waves: 12, stopped: 148, clean: 5, seed: 1, bgen: 2 }, 2)).toBe(36); // the waves and stopped terms are untouched
  });

  it('the Iron multiplier doubles the whole payout, after the claim node has applied', () => {
    expect(coinsForRun({ waves: 12, stopped: 148, clean: 5, seed: 1, bgen: 2 }, 1, 2)).toBe(62); // (12 + 14 + 5) * 2
    expect(coinsForRun({ waves: 12, stopped: 148, clean: 5, seed: 1, bgen: 2 }, 2, 2)).toBe(72); // the node's doubled clean term is doubled too
    expect(coinsForRun({ waves: 0, stopped: 19, clean: 1, seed: 1, bgen: 2 }, 2, 2)).toBe(6); // (1 + 2) * 2
    expect(coinsForRun({ waves: 0, stopped: 0, clean: 0, seed: 1, bgen: 2 }, 2, 2)).toBe(0);
  });

  it('a recorded Iron run pays the doubled payout', () => {
    const store = memory();
    store.setItem('chokepoint:profile', JSON.stringify({ purchased: ['clean2'] }));
    const owned = recordRun(store, { waves: 1, stopped: 10, clean: 3, seed: 105, bgen: 2, mul: 2 });
    expect(owned.coins).toBe(16); // (1 + 1 + 6) * 2, the claim node's term first
    expect(recordRun(memory(), { waves: 1, stopped: 10, clean: 3, seed: 105, bgen: 2, mul: 2 }).coins).toBe(10); // (1 + 1 + 3) * 2
    expect(recordRun(memory(), { waves: 1, stopped: 10, clean: 3, seed: 105, bgen: 2 }).coins).toBe(5); // an ordinary run is untouched
  });

  it('the level augments\' multiplier scales the whole payout, after the mode\'s, rounded down once', () => {
    expect(coinsForRun({ waves: 12, stopped: 148, clean: 5, seed: 1, bgen: 2 }, 1, 1, 1.25)).toBe(38); // floor 38.75
    expect(coinsForRun({ waves: 12, stopped: 148, clean: 5, seed: 1, bgen: 2 }, 1, 2, 1.25)).toBe(77); // Iron + Tough: floor 77.5
    expect(coinsForRun({ waves: 0, stopped: 19, clean: 0, seed: 1, bgen: 2 }, 1, 1, 1.25)).toBe(1); // floor 1.25
    expect(coinsForRun({ waves: 12, stopped: 148, clean: 5, seed: 1, bgen: 2 }, 2, 1, 1)).toBe(36); // ×1.0: the payout of today, untouched
  });

  it('a recorded level-augment run pays the multiplied payout, Iron still doubled on top', () => {
    expect(recordRun(memory(), { waves: 12, stopped: 148, clean: 5, seed: 1, bgen: 2, levelMul: 1.25 }).coins).toBe(38);
    expect(recordRun(memory(), { waves: 12, stopped: 148, clean: 5, seed: 1, bgen: 2, mul: 2, levelMul: 1.25 }).coins).toBe(77); // Iron + Tough
    const plain = recordRun(memory(), { waves: 12, stopped: 148, clean: 5, seed: 1, bgen: 2, levelMul: 1 });
    expect(plain.coins).toBe(31); // a ×1.0 run pays exactly what it pays today
    expect(plain.profile.lastRun).toEqual({ wave: 12, coins: 31 });
  });

  it('a recorded run pays the doubled clean term only once the claim node is owned', () => {
    const store = memory();
    store.setItem('chokepoint:profile', JSON.stringify({ purchased: ['clean2'] }));
    const owned = recordRun(store, { waves: 1, stopped: 10, clean: 3, seed: 105, bgen: 2 });
    expect(owned.coins).toBe(8); // 1 wave + a coin per ten stopped + 3 clean waves paying two each
    expect(recordRun(memory(), { waves: 1, stopped: 10, clean: 3, seed: 105, bgen: 2 }).coins).toBe(5);
  });

  it('loads an empty profile from missing or broken storage', () => {
    const empty = { bestWave: 0, bestSeed: null, bestSeedBgen: null, ironBestWave: 0, runsPlayed: 0, coins: 0, purchased: [], lastRun: null, recent: [], sound: true, levelSlots: 0, levelOn: [] };
    expect(loadProfile(undefined)).toEqual(empty);
    expect(loadProfile({ getItem: () => '{oops', setItem: () => undefined })).toEqual(empty);
    const store = memory();
    store.setItem('chokepoint:profile', JSON.stringify({ bestWave: 4, lastRun: { wave: 'x', coins: 2 } }));
    expect(loadProfile(store)).toEqual({ bestWave: 4, bestSeed: null, bestSeedBgen: null, ironBestWave: 0, runsPlayed: 0, coins: 0, purchased: [], lastRun: null, recent: [], sound: true, levelSlots: 0, levelOn: [] });
    store.setItem('chokepoint:profile', JSON.stringify({ recent: [{ wave: 7, coins: 2 }, null, { wave: 1, coins: -4 }] }));
    expect(loadProfile(store).recent).toEqual([{ wave: 7, coins: 2 }]);
  });

  it('records the first run and keeps the best over later runs', () => {
    const store = memory();
    const first = recordRun(store, { waves: 5, stopped: 40, clean: 2, seed: 101, bgen: 2 });
    expect(first.coins).toBe(11);
    expect(first.newBest).toBe(true);
    expect(first.profile).toEqual({ bestWave: 5, bestSeed: 101, bestSeedBgen: 2, ironBestWave: 0, runsPlayed: 1, coins: 11, purchased: [], lastRun: { wave: 5, coins: 11 }, recent: [{ wave: 5, coins: 11 }], sound: true, levelSlots: 0, levelOn: [] });

    const second = recordRun(store, { waves: 3, stopped: 10, clean: 1, seed: 102, bgen: 2 });
    expect(second.newBest).toBe(false);
    expect(second.profile).toEqual({ bestWave: 5, bestSeed: 101, bestSeedBgen: 2, ironBestWave: 0, runsPlayed: 2, coins: 16, purchased: [], lastRun: { wave: 3, coins: 5 }, recent: [{ wave: 3, coins: 5 }, { wave: 5, coins: 11 }], sound: true, levelSlots: 0, levelOn: [] });
    expect(loadProfile(store).coins).toBe(16);
  });

  it('a zero-wave run adds no coins but still counts as a run', () => {
    const store = memory();
    const result = recordRun(store, { waves: 0, stopped: 0, clean: 0, seed: 103, bgen: 2 });
    expect(result.coins).toBe(0);
    expect(result.profile).toEqual({ bestWave: 0, bestSeed: null, bestSeedBgen: null, ironBestWave: 0, runsPlayed: 1, coins: 0, purchased: [], lastRun: { wave: 0, coins: 0 }, recent: [{ wave: 0, coins: 0 }], sound: true, levelSlots: 0, levelOn: [] });
  });

  it('stores the seed of the run that sets the best wave, and only of it', () => {
    const store = memory();
    expect(recordRun(store, { waves: 4, stopped: 0, clean: 0, seed: 101, bgen: 2 }).profile.bestSeed).toBe(101);
    // A ghost run replays the best board: the same seed, a higher best — the seed stays.
    expect(recordRun(store, { waves: 9, stopped: 0, clean: 0, seed: 101, bgen: 2 }).profile.bestSeed).toBe(101);
    // A run on a new board sets a higher best — the button points to it.
    expect(recordRun(store, { waves: 12, stopped: 0, clean: 0, seed: 102, bgen: 2 }).profile.bestSeed).toBe(102);
    // Below the best, the seed is left alone.
    expect(recordRun(store, { waves: 6, stopped: 0, clean: 0, seed: 103, bgen: 2 }).profile.bestSeed).toBe(102);
  });

  it('heals a legacy profile without a bestSeed, and rejects a broken one', () => {
    const store = memory();
    store.setItem('chokepoint:profile', JSON.stringify({ bestWave: 6, runsPlayed: 3, coins: 20 }));
    expect(loadProfile(store).bestSeed).toBeNull();
    const result = recordRun(store, { waves: 7, stopped: 0, clean: 0, seed: 404, bgen: 2 });
    expect(result.newBest).toBe(true);
    expect(result.profile.bestSeed).toBe(404);

    store.setItem('chokepoint:profile', JSON.stringify({ bestWave: 6, bestSeed: 'x' }));
    expect(loadProfile(store).bestSeed).toBeNull();
    store.setItem('chokepoint:profile', JSON.stringify({ bestWave: 6, bestSeed: 2 ** 40 }));
    expect(loadProfile(store).bestSeed).toBeNull();
  });

  it('the sound preference defaults to on and sticks through runs', () => {
    const store = memory();
    expect(loadProfile(undefined).sound).toBe(true);
    saveSound(store, false);
    expect(loadProfile(store).sound).toBe(false);
    recordRun(store, { waves: 2, stopped: 0, clean: 0, seed: 104, bgen: 2 });
    expect(loadProfile(store).sound).toBe(false);
    saveSound(store, true);
    expect(loadProfile(store).sound).toBe(true);
  });

  it('the first run to reach wave 30 earns the one level slot, once and only once', () => {
    const store = memory();
    expect(recordRun(store, { waves: 29, stopped: 0, clean: 0, seed: 301, bgen: 2 }).profile.levelSlots).toBe(0); // ended just short
    expect(recordRun(store, { waves: 29, stopped: 0, clean: 0, seed: 302, bgen: 2, reached: 30 }).profile.levelSlots).toBe(1); // died during wave 30
    expect(recordRun(store, { waves: 30, stopped: 0, clean: 0, seed: 303, bgen: 2, reached: 31 }).profile.levelSlots).toBe(1); // never more than one
    expect(recordRun(store, { waves: 12, stopped: 0, clean: 0, seed: 304, bgen: 2 }).profile.levelSlots).toBe(1); // never fewer
  });

  it('the slot ladder saves a new slot at the run\'s end, never loses one, and flags the earn', () => {
    const store = memory();
    store.setItem('chokepoint:profile', JSON.stringify({ levelSlots: 2, levelOn: ['tough', 'swift'] }));
    const earned = recordRun(store, { waves: 29, stopped: 0, clean: 0, seed: 311, bgen: 2, reached: 30 });
    expect(earned.profile.levelSlots).toBe(3); // died during wave 30 with both slots filled
    expect(earned.levelSlotEarned).toBe(true);
    const short = recordRun(store, { waves: 5, stopped: 0, clean: 0, seed: 312, bgen: 2 });
    expect(short.profile.levelSlots).toBe(3); // a short run never takes the slot back
    expect(short.levelSlotEarned).toBe(false);
    store.setItem('chokepoint:profile', JSON.stringify({ levelSlots: 2, levelOn: ['tough'] }));
    const gap = recordRun(store, { waves: 30, stopped: 0, clean: 0, seed: 313, bgen: 2 });
    expect(gap.profile.levelSlots).toBe(2); // a slot left empty: nothing earned
    expect(gap.levelSlotEarned).toBe(false);
  });

  it('saves the level-augment choice, drops unknown ids on load, and keeps it through runs', () => {
    const store = memory();
    saveLevelOn(store, ['tough', 'nope']);
    expect(loadProfile(store).levelOn).toEqual(['tough']);
    expect(recordRun(store, { waves: 5, stopped: 0, clean: 0, seed: 305, bgen: 2 }).profile.levelOn).toEqual(['tough']);
    saveLevelOn(store, []);
    expect(loadProfile(store).levelOn).toEqual([]);
  });

  it('keeps the four most recent runs, newest first', () => {
    const store = memory();
    let seed = 200;
    for (const waves of [5, 3, 8, 2, 9]) recordRun(store, { waves, stopped: 0, clean: 0, seed: ++seed, bgen: 2 });
    expect(loadProfile(store).recent).toEqual([
      { wave: 9, coins: 9 },
      { wave: 2, coins: 2 },
      { wave: 8, coins: 8 },
      { wave: 3, coins: 3 },
    ]);
  });
});
