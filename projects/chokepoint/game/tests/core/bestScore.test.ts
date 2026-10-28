import { describe, expect, it } from 'vitest';
import { loadBest, saveIfBest, type KeyValueStore } from '../../src/core/bestScore';

const memory = (): KeyValueStore => {
  const data = new Map<string, string>();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};

describe('best run', () => {
  it('keeps only better scores', () => {
    const store = memory();
    expect(loadBest(store)).toEqual({ wave: 0, score: 0 });
    expect(saveIfBest(store, { wave: 3, score: 310 })).toBe(true);
    expect(saveIfBest(store, { wave: 2, score: 205 })).toBe(false);
    expect(loadBest(store)).toEqual({ wave: 3, score: 310 });
  });

  it('survives missing or broken storage', () => {
    expect(loadBest(undefined)).toEqual({ wave: 0, score: 0 });
    expect(loadBest({ getItem: () => '{oops', setItem: () => undefined })).toEqual({ wave: 0, score: 0 });
  });
});
