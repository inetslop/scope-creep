import type { EnemyDef } from '../content/types';

/** The leg of the Leech's drink cycle (its own clock): the quiet walk, the white flash, the drink. */
export type DrinkLeg = 'idle' | 'flash' | 'drink';

/**
 * Which leg the drink cycle is in at `clock` seconds since the Leech spawned: it walks quietly
 * for most of the cycle, flashes white for the telegraph, then drinks for the drink. Enemy's
 * advance and the hook (systems/enemyHooks/leechDrink.ts) both read this, so they never disagree.
 */
export function drinkLeg(spec: NonNullable<EnemyDef['drinks']>, clock: number): DrinkLeg {
  const t = clock % spec.everySec;
  const fs = spec.everySec - spec.telegraphSec - spec.drinkSec;
  return t < fs ? 'idle' : t < fs + spec.telegraphSec ? 'flash' : 'drink';
}
