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
  bgen: 2,
  gold: 260,
  lives: 17,
  mode: 'play',
  wave: 3,
  phase: 'build',
  hand: [{ id: 'frost', tier: 'rare' }],
  kills: 42,
  cleanWaves: 2,
  streakPaid: false,
  rerollsUsed: 1,
  level: [],
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

  it('rejects a broken board-generation version, but a save written without the key loads as 1', () => {
    broken({ bgen: 0 });
    broken({ bgen: 9 });
    broken({ bgen: 1.5 });
    broken({ bgen: 'x' });
    const store = memory();
    const without = { ...sample() } as Record<string, unknown>;
    delete without.bgen; // older saves predate the field
    store.setItem(SAVED_RUN_KEY, JSON.stringify(without));
    expect(loadSavedRun(store)).toEqual({ ...sample(), bgen: 1 });
  });

  it('round-trips a longer-road save', () => {
    const store = memory();
    saveRun(store, sample({ lengthMul: 1.25, bends: 1 }));
    expect(loadSavedRun(store)).toEqual(sample({ lengthMul: 1.25, bends: 1 }));
  });

  it('round-trips the level choice, and a save written without the key loads with none on', () => {
    const store = memory();
    saveRun(store, sample({ level: ['tough'] }));
    expect(loadSavedRun(store)).toEqual(sample({ level: ['tough'] }));
    const without = { ...sample() } as Record<string, unknown>;
    delete without.level; // older saves predate the field
    store.setItem(SAVED_RUN_KEY, JSON.stringify(without));
    expect(loadSavedRun(store)).toEqual(sample());
  });

  it('rejects a broken level choice, including the number older saves wrote under the removed level rule', () => {
    broken({ level: 1 }); // the number saves wrote before this rule (T0260)
    broken({ level: 'tough' });
    broken({ level: [1] });
    broken({ level: ['nope'] });
    broken({ level: ['tough', 'nope'] });
    broken({ level: Array(17).fill('tough') });
  });

  it('round-trips an Iron save, and a save written without the key loads as play', () => {
    const store = memory();
    saveRun(store, sample({ mode: 'iron', lives: 1 }));
    expect(loadSavedRun(store)).toEqual(sample({ mode: 'iron', lives: 1 }));
    const without = { ...sample() } as Record<string, unknown>;
    delete without.mode; // older saves predate the field
    store.setItem(SAVED_RUN_KEY, JSON.stringify(without));
    expect(loadSavedRun(store)).toEqual(sample());
    broken({ mode: 'ghost' });
    broken({ mode: 1 });
  });

  it('round-trips a streak-paid save, and a save written without the key loads as unpaid', () => {
    const store = memory();
    saveRun(store, sample({ streakPaid: true }));
    expect(loadSavedRun(store)).toEqual(sample({ streakPaid: true }));
    const without = { ...sample() } as Record<string, unknown>;
    delete without.streakPaid; // older saves predate the field
    store.setItem(SAVED_RUN_KEY, JSON.stringify(without));
    expect(loadSavedRun(store)).toEqual(sample());
    broken({ streakPaid: 'x' });
  });

  it('migrates the old rerollUsed flag to the reroll count', () => {
    const store = memory();
    const oldTrue = { ...sample() } as Record<string, unknown>;
    delete oldTrue.rerollsUsed; // older saves predate the field
    oldTrue.rerollUsed = true;
    store.setItem(SAVED_RUN_KEY, JSON.stringify(oldTrue));
    expect(loadSavedRun(store)).toEqual(sample()); // sample() counts 1
    const oldFalse = { ...sample() } as Record<string, unknown>;
    delete oldFalse.rerollsUsed;
    oldFalse.rerollUsed = false;
    store.setItem(SAVED_RUN_KEY, JSON.stringify(oldFalse));
    expect(loadSavedRun(store)).toEqual({ ...sample(), rerollsUsed: 0 });
    broken({ rerollsUsed: -1 });
    broken({ rerollsUsed: 1.5 });
    const junk = { ...sample() } as Record<string, unknown>;
    delete junk.rerollsUsed; // an old flag that is not a boolean is not a migration
    junk.rerollUsed = 'x';
    store.setItem(SAVED_RUN_KEY, JSON.stringify(junk));
    expect(loadSavedRun(store)).toBeUndefined();
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
