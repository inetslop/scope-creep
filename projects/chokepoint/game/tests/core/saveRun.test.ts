import { describe, expect, it } from 'vitest';
import { SAVED_RUN_KEY, clearSavedRun, loadSavedRun, saveRun, type RunStore, type SavedRun } from '../../src/core/saveRun';

const memory = (): RunStore => {
  const data = new Map<string, string>();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
};

const sample = (over: Partial<SavedRun> = {}): SavedRun => ({
  v: 1,
  seed: 123456789,
  cols: 14,
  rows: 8,
  bends: 0,
  lengthMul: 1,
  gold: 260,
  lives: 17,
  wave: 3,
  phase: 'build',
  hand: [{ id: 'frost', tier: 'rare' }],
  kills: 42,
  cleanWaves: 2,
  rerollUsed: true,
  towers: [
    { col: 2, row: 1, slots: 2, augments: [{ id: 'bolt', tier: 'common' }, { id: 'frost', tier: 'epic' }] },
    { col: 9, row: 5, slots: 1, augments: [{ id: 'mint', tier: 'common' }] },
  ],
  ...over,
});

/** Writes a broken save straight into the store and expects it not to load. */
const broken = (over: Record<string, unknown>): void => {
  const store = memory();
  store.setItem(SAVED_RUN_KEY, JSON.stringify({ ...sample(), ...over }));
  expect(loadSavedRun(store)).toBeUndefined();
};

describe('saveRun', () => {
  it('round-trips to an equal object, and clearSavedRun empties it', () => {
    const store = memory();
    saveRun(store, sample());
    expect(loadSavedRun(store)).toEqual(sample());
    clearSavedRun(store);
    expect(loadSavedRun(store)).toBeUndefined();
  });

  it('returns undefined for missing or broken storage', () => {
    expect(loadSavedRun(undefined)).toBeUndefined();
    expect(loadSavedRun(memory())).toBeUndefined();
    const store = memory();
    store.setItem(SAVED_RUN_KEY, '');
    expect(loadSavedRun(store)).toBeUndefined();
    store.setItem(SAVED_RUN_KEY, '{oops');
    expect(loadSavedRun(store)).toBeUndefined();
    store.setItem(SAVED_RUN_KEY, JSON.stringify(null));
    expect(loadSavedRun(store)).toBeUndefined();
  });

  it('rejects a save that is not version 1 or in a saved phase', () => {
    broken({ v: 2 });
    broken({ phase: 'draft' });
  });

  it('rejects broken numbers', () => {
    broken({ wave: -1 });
    broken({ phase: 'wave', wave: 0 });
    broken({ seed: -1 });
    broken({ seed: 1.5 });
    broken({ cols: 0 });
    broken({ rows: 33 });
    broken({ gold: -1 });
    broken({ gold: Number.NaN });
    broken({ lives: 20.5 });
  });

  it('rejects a broken bends count, but a save written without the key loads as 0', () => {
    broken({ bends: 2 });
    broken({ bends: -1 });
    broken({ bends: 1.5 });
    const store = memory();
    const without = { ...sample() } as Record<string, unknown>;
    delete without.bends; // older saves predate the field
    store.setItem(SAVED_RUN_KEY, JSON.stringify(without));
    expect(loadSavedRun(store)).toEqual(sample());
  });

  it('rejects a broken road length, but a save written without the key loads as 1', () => {
    broken({ lengthMul: 0 });
    broken({ lengthMul: 2 });
    broken({ lengthMul: 1.5 });
    const store = memory();
    const without = { ...sample() } as Record<string, unknown>;
    delete without.lengthMul; // older saves predate the field
    store.setItem(SAVED_RUN_KEY, JSON.stringify(without));
    expect(loadSavedRun(store)).toEqual(sample());
  });

  it('round-trips a longer-road save', () => {
    const store = memory();
    saveRun(store, sample({ lengthMul: 1.25, bends: 1 }));
    expect(loadSavedRun(store)).toEqual(sample({ lengthMul: 1.25, bends: 1 }));
  });

  it('rejects a broken hand or towers', () => {
    broken({ hand: [{ id: 'nope', tier: 'common' }] });
    broken({ hand: [{ id: 'bolt', tier: 'mythic' }] });
    broken({ hand: [null] });
    broken({ towers: [{ col: 2, row: 1, slots: 0, augments: [] }] });
    broken({ towers: [{ col: 2, row: 1, slots: 5, augments: [] }] });
    broken({ towers: [{ col: 2, row: 1, slots: 1, augments: [{ id: 'bolt', tier: 'common' }, { id: 'frost', tier: 'common' }] }] });
    broken({ towers: [{ col: 64, row: 1, slots: 1, augments: [{ id: 'bolt', tier: 'common' }] }] });
    broken({ towers: [{ col: 20, row: 1, slots: 1, augments: [{ id: 'bolt', tier: 'common' }] }] }); // past the save's 14 columns
  });
});
