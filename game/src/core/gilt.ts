import type { Rng } from './rng';

/** Gilt shards: GILT_CHANCE of dropped shards are gilt and worth GILT_MULTIPLIER × the same drop's XP. */
export const GILT_CHANCE = 0.05;
export const GILT_MULTIPLIER = 3;

/** One seeded roll per shard, taken once at drop time (exactly one rng draw). */
export function rollGilt(rng: Rng): boolean {
  return rng.chance(GILT_CHANCE);
}

/** XP awarded on collect. `value` is the base drop value; xpMul is applied afterwards in run.addXp. */
export function shardXp(value: number, gilt: boolean): number {
  return gilt ? value * GILT_MULTIPLIER : value;
}
