import { describe, expect, it } from 'vitest';
import { coinsForRun, loadProfile, recordRun, saveSound, type KeyValueStore } from '../../src/core/profile';

const memory = (): KeyValueStore => {
  const data = new Map<string, string>();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};

describe('profile', () => {
  it('coins are the waves held, plus a coin per ten stopped, plus the clean waves', () => {
    expect(coinsForRun({ waves: 12, stopped: 148, clean: 5 })).toBe(31);
    expect(coinsForRun({ waves: 0, stopped: 0, clean: 0 })).toBe(0);
    expect(coinsForRun({ waves: 0, stopped: 19, clean: 0 })).toBe(1);
    expect(coinsForRun({ waves: 0, stopped: 20, clean: 0 })).toBe(2);
  });

  it('loads an empty profile from missing or broken storage', () => {
    const empty = { bestWave: 0, runsPlayed: 0, coins: 0, lastRun: null, recent: [], sound: true };
    expect(loadProfile(undefined)).toEqual(empty);
    expect(loadProfile({ getItem: () => '{oops', setItem: () => undefined })).toEqual(empty);
    const store = memory();
    store.setItem('chokepoint:profile', JSON.stringify({ bestWave: 4, lastRun: { wave: 'x', coins: 2 } }));
    expect(loadProfile(store)).toEqual({ bestWave: 4, runsPlayed: 0, coins: 0, lastRun: null, recent: [], sound: true });
    store.setItem('chokepoint:profile', JSON.stringify({ recent: [{ wave: 7, coins: 2 }, null, { wave: 1, coins: -4 }] }));
    expect(loadProfile(store).recent).toEqual([{ wave: 7, coins: 2 }]);
  });

  it('records the first run and keeps the best over later runs', () => {
    const store = memory();
    const first = recordRun(store, { waves: 5, stopped: 40, clean: 2 });
    expect(first.coins).toBe(11);
    expect(first.newBest).toBe(true);
    expect(first.profile).toEqual({ bestWave: 5, runsPlayed: 1, coins: 11, lastRun: { wave: 5, coins: 11 }, recent: [{ wave: 5, coins: 11 }], sound: true });

    const second = recordRun(store, { waves: 3, stopped: 10, clean: 1 });
    expect(second.newBest).toBe(false);
    expect(second.profile).toEqual({ bestWave: 5, runsPlayed: 2, coins: 16, lastRun: { wave: 3, coins: 5 }, recent: [{ wave: 3, coins: 5 }, { wave: 5, coins: 11 }], sound: true });
    expect(loadProfile(store).coins).toBe(16);
  });

  it('a zero-wave run adds no coins but still counts as a run', () => {
    const store = memory();
    const result = recordRun(store, { waves: 0, stopped: 0, clean: 0 });
    expect(result.coins).toBe(0);
    expect(result.profile).toEqual({ bestWave: 0, runsPlayed: 1, coins: 0, lastRun: { wave: 0, coins: 0 }, recent: [{ wave: 0, coins: 0 }], sound: true });
  });

  it('the sound preference defaults to on and sticks through runs', () => {
    const store = memory();
    expect(loadProfile(undefined).sound).toBe(true);
    saveSound(store, false);
    expect(loadProfile(store).sound).toBe(false);
    recordRun(store, { waves: 2, stopped: 0, clean: 0 });
    expect(loadProfile(store).sound).toBe(false);
    saveSound(store, true);
    expect(loadProfile(store).sound).toBe(true);
  });

  it('keeps the four most recent runs, newest first', () => {
    const store = memory();
    for (const waves of [5, 3, 8, 2, 9]) recordRun(store, { waves, stopped: 0, clean: 0 });
    expect(loadProfile(store).recent).toEqual([
      { wave: 9, coins: 9 },
      { wave: 2, coins: 2 },
      { wave: 8, coins: 8 },
      { wave: 3, coins: 3 },
    ]);
  });
});
