import { burnLeap } from './burnLeap';
import type { MakeEnemyHook } from './hook';
import { haulerLeak } from './haulerLeak';
import { mintRing } from './mintRing';
import { split } from './split';
import { killCoin } from './killCoin';

/**
 * Everything that reacts to kills, leaks or every frame of a wave, one per line (see hook.ts).
 * A new one is a new file in this folder plus one line here, next to its kin.
 */
export const ENEMY_HOOKS: readonly MakeEnemyHook[] = [
  split,
  killCoin,
  haulerLeak,
  burnLeap,
  mintRing,
];
