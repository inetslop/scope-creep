import { burnLeap } from './burnLeap';
import { burnTick } from './burnTick';
import type { MakeEnemyHook } from './hook';
import { comboBreak } from './comboBreak';
import { comboGold } from './comboGold';
import { haulerLeak } from './haulerLeak';
import { mintRing } from './mintRing';
import { muteJam } from './muteJam';
import { nameTag } from './nameTag';
import { markTick } from './markTick';
import { crackTick } from './crackTick';
import { rampTick } from './rampTick';
import { slowTick } from './slowTick';
import { split } from './split';
import { killCoin } from './killCoin';

/**
 * Everything that reacts to kills, leaks or every frame of a wave, one per line (see hook.ts).
 * A new one is a new file in this folder plus one line here, next to its kin.
 */
export const ENEMY_HOOKS: readonly MakeEnemyHook[] = [
  comboGold,
  comboBreak,
  split,
  nameTag,
  markTick,
  crackTick,
  rampTick,
  killCoin,
  haulerLeak,
  burnLeap,
  burnTick,
  slowTick,
  muteJam,
  mintRing,
];
