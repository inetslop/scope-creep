import { burnLeap } from './burnLeap';
import { sprayNeedles } from './sprayNeedles';
import type { MakeEnemyHook } from './hook';
import { comboBreak } from './comboBreak';
import { leakEcho } from './leakEcho';
import { bossEscape } from './bossEscape';
import { bossDeath } from './bossDeath';
import { titanShield } from './titanShield';
import { shieldDown } from './shieldDown';
import { comboGold } from './comboGold';
import { haulerLeak } from './haulerLeak';
import { mintRing } from './mintRing';
import { tollLeak } from './tollLeak';
import { muteJam } from './muteJam';
import { nameTag } from './nameTag';
import { bossArrival } from './bossArrival';
import { bossOut } from './bossOut';
import { bossPhase } from './bossPhase';
import { crackTick } from './crackTick';
import { split } from './split';
import { midSplit } from './midSplit';
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
  nameTag,
  bossArrival,
  bossOut,
  bossPhase,
  crackTick,
  killCoin,
  killMilestone,
  waveClose,
  nearMiss,
  haulerLeak,
  tollLeak,
  burnLeap,
  sprayNeedles,
  muteJam,
  mintRing,
];
