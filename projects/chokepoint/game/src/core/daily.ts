import { LEVEL_AUGMENTS } from '../content/levels';
import { Rng } from './rng';

/**
 * The day's board pick: from the UTC date, three board seeds, and each board's level-augment
 * order. Pure: the same UTC day always gives the same choices, to every player.
 */

/** The UTC calendar day of a moment, 'YYYY-MM-DD' — UTC, never the local day, so everyone shares a day. */
export function utcDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** The three board seeds of a UTC day: the FNV-1a 31-bit hash of `${day}:0`, `:1`, `:2`. */
export function dailySeeds(day: string): [number, number, number] {
  const hash = (text: string): number => {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) % 2 ** 31;
  };
  return [hash(`${day}:0`), hash(`${day}:1`), hash(`${day}:2`)];
}

/**
 * The board's level-augment order: the six levels of before, shuffled by the board's seed exactly
 * as today, with Plain and Clumps inserted at positions the seed picks. Both are filtered out
 * before the shuffle (never extra entries: a longer list would move every seed's draws of the six)
 * and added after — Plain on the first draw of a fresh Rng(seed), Clumps on the second — so a
 * board without either on it plays today's exact order.
 */
export function dailyOrder(seed: number): string[] {
  const six = new Rng(seed).shuffle(LEVEL_AUGMENTS.filter((a) => a.id !== 'plain' && a.id !== 'clumps').map((a) => a.id));
  const r = new Rng(seed);
  const atPlain = r.int(0, six.length);
  const seven = [...six.slice(0, atPlain), 'plain', ...six.slice(atPlain)];
  const atClumps = r.int(0, seven.length);
  return [...seven.slice(0, atClumps), 'clumps', ...seven.slice(atClumps)];
}

/** The board's level L: the first L of its order, so a higher level only adds augments to the same boards. */
export function dailyLevel(seed: number, level: number): string[] {
  return dailyOrder(seed).slice(0, Math.max(0, level));
}

/** What the pick step hands the game under 'dailyPick': the board's seed and the level augments it carries. */
export interface DailyPick {
  seed: number;
  level: string[];
}
