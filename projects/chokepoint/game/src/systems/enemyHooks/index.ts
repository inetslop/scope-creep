import { burnLeap } from './burnLeap';
import type { MakeEnemyHook } from './hook';
import { comboBreak } from './comboBreak';
import { comboGold } from './comboGold';
import { haulerLeak } from './haulerLeak';
import { mintRing } from './mintRing';
import { tollLeak } from './tollLeak';
import { muteJam } from './muteJam';
import { nameTag } from './nameTag';
import { crackTick } from './crackTick';
import { split } from './split';
import { killCoin } from './killCoin';
import { waveClose } from './waveClose';

/**
 * Everything that reacts to kills, leaks or every frame of a wave, one per line (see hook.ts).
 * A new one is a new file in this folder plus one line here, next to its kin.
 */
export const ENEMY_HOOKS: readonly MakeEnemyHook[] = [
  comboGold,
  comboBreak,
  split,
  nameTag,
  crackTick,
  killCoin,
  waveClose,
  haulerLeak,
  tollLeak,
  burnLeap,
  muteJam,
  mintRing,
];
