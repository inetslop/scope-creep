import { describe, expect, it } from 'vitest';
import { coinsForRun, loadProfile, recordRun, saveSound, type KeyValueStore } from '../../src/core/profile';

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

  it('a recorded run pays the doubled clean term only once the claim node is owned', () => {
    const store = memory();
    store.setItem('chokepoint:profile', JSON.stringify({ purchased: ['clean2'] }));
    const owned = recordRun(store, { waves: 1, stopped: 10, clean: 3, seed: 105, bgen: 2 });
    expect(owned.coins).toBe(8); // 1 wave + a coin per ten stopped + 3 clean waves paying two each
    expect(recordRun(memory(), { waves: 1, stopped: 10, clean: 3, seed: 105, bgen: 2 }).coins).toBe(5);
  });

  it('loads an empty profile from missing or broken storage', () => {
    const empty = { bestWave: 0, bestSeed: null, bestSeedBgen: null, runsPlayed: 0, coins: 0, purchased: [], lastRun: null, recent: [], sound: true };
    expect(loadProfile(undefined)).toEqual(empty);
    expect(loadProfile({ getItem: () => '{oops', setItem: () => undefined })).toEqual(empty);
    const store = memory();
    store.setItem('chokepoint:profile', JSON.stringify({ bestWave: 4, lastRun: { wave: 'x', coins: 2 } }));
    expect(loadProfile(store)).toEqual({ bestWave: 4, bestSeed: null, bestSeedBgen: null, runsPlayed: 0, coins: 0, purchased: [], lastRun: null, recent: [], sound: true });
    store.setItem('chokepoint:profile', JSON.stringify({ recent: [{ wave: 7, coins: 2 }, null, { wave: 1, coins: -4 }] }));
    expect(loadProfile(store).recent).toEqual([{ wave: 7, coins: 2 }]);
  });

  it('records the first run and keeps the best over later runs', () => {
    const store = memory();
    const first = recordRun(store, { waves: 5, stopped: 40, clean: 2, seed: 101, bgen: 2 });
    expect(first.coins).toBe(11);
    expect(first.newBest).toBe(true);
    expect(first.profile).toEqual({ bestWave: 5, bestSeed: 101, bestSeedBgen: 2, runsPlayed: 1, coins: 11, purchased: [], lastRun: { wave: 5, coins: 11 }, recent: [{ wave: 5, coins: 11 }], sound: true });

    const second = recordRun(store, { waves: 3, stopped: 10, clean: 1, seed: 102, bgen: 2 });
    expect(second.newBest).toBe(false);
    expect(second.profile).toEqual({ bestWave: 5, bestSeed: 101, bestSeedBgen: 2, runsPlayed: 2, coins: 16, purchased: [], lastRun: { wave: 3, coins: 5 }, recent: [{ wave: 3, coins: 5 }, { wave: 5, coins: 11 }], sound: true });
    expect(loadProfile(store).coins).toBe(16);
  });

  it('a zero-wave run adds no coins but still counts as a run', () => {
    const store = memory();
    const result = recordRun(store, { waves: 0, stopped: 0, clean: 0, seed: 103, bgen: 2 });
    expect(result.coins).toBe(0);
    expect(result.profile).toEqual({ bestWave: 0, bestSeed: null, bestSeedBgen: null, runsPlayed: 1, coins: 0, purchased: [], lastRun: { wave: 0, coins: 0 }, recent: [{ wave: 0, coins: 0 }], sound: true });
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
