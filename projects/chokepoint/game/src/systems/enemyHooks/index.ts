import { burnLeap } from './burnLeap';
import type { MakeEnemyHook } from './hook';
import { comboBreak } from './comboBreak';
import { leakEcho } from './leakEcho';
import { bossEscape } from './bossEscape';
import { bossDeath } from './bossDeath';
import { titanShield } from './titanShield';
import { shieldDown } from './shieldDown';
import { comboGold } from './comboGold';
import { haulerLeak } from './haulerLeak';
import { haulerTeach } from './haulerTeach';
import { blockTeach } from './blockTeach';
import { mintRing } from './mintRing';
import { tollLeak } from './tollLeak';
import { muteJam } from './muteJam';
import { feederPack } from './feederPack';
import { wardDeny } from './wardDeny';
import { bulwarkPlate } from './bulwarkPlate';
import { nameTag } from './nameTag';
import { bossArrival } from './bossArrival';
import { bossOut } from './bossOut';
import { bossPhase } from './bossPhase';
import { bossBack } from './bossBack';
import { dasherStreak } from './dasherStreak';
import { sprinterRamp } from './sprinterRamp';
import { crackDeep } from './crackDeep';
import { split } from './split';
import { midSplit } from './midSplit';
import { orbSplit } from './orbSplit';
import { killCoin } from './killCoin';
import { killMilestone } from './killMilestone';
import { waveClose } from './waveClose';
import { nearMiss } from './nearMiss';

/**
 * Everything that reacts to kills, leaks or every frame of a wave, one per line (see hook.ts).
 * A new one is a new file in this folder plus one line here, next to its kin.
 */
export const ENEMY_HOOKS: readonly MakeEnemyHook[] = [
  comboGold,
  comboBreak,
  leakEcho,
  bossEscape,
  bossDeath,
  titanShield,
  shieldDown,
  split,
  midSplit,
  orbSplit,
  nameTag,
  bossArrival,
  bossOut,
  bossPhase,
  bossBack,
  dasherStreak,
  sprinterRamp,
  crackDeep,
  killCoin,
  killMilestone,
  waveClose,
  nearMiss,
  haulerLeak,
  haulerTeach,
  blockTeach,
  tollLeak,
  burnLeap,
  muteJam,
  feederPack,
  wardDeny,
  bulwarkPlate,
  mintRing,
];
