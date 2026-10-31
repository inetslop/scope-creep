/** Seeded randomness (mulberry32): the server's gameplay rolls, and stable per-seed values for visuals. */

export interface Rng {
  /** 0 <= n < 1 */
  next(): number;
  /** min <= n < max */
  range(min: number, max: number): number;
  /** 0 <= n < count, a whole number */
  int(count: number): number;
  chance(probability: number): boolean;
  pick<T>(items: readonly T[]): T;
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (min, max) => min + next() * (max - min),
    int: (count) => Math.floor(next() * count),
    chance: (p) => next() < p,
    pick: <T>(items: readonly T[]): T => {
      if (items.length === 0) throw new Error('rng.pick: empty list');
      return items[Math.floor(next() * items.length)]!;
    },
  };
}

/** A stable 0..1 value for (seed, i): the same on the server and every client. */
export function noise(seed: number, i = 0): number {
  let h = Math.imul((seed | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(i | 0, 0xc2b2ae35);
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** FNV-1a over a string. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
