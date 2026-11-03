import { burnLeap } from './burnLeap';
import type { MakeEnemyHook } from './hook';
import { comboBreak } from './comboBreak';
import { comboBreakNote } from './comboBreakNote';
import { leakEcho } from './leakEcho';
import { bossEscape } from './bossEscape';
import { bossDeath } from './bossDeath';
import { titanShield } from './titanShield';
import { leechDrink } from './leechDrink';
import { shieldDown } from './shieldDown';
import { comboGold } from './comboGold';
import { haulerLeakNote } from './haulerLeakNote';
import { haulerLeak } from './haulerLeak';
import { haulerTeach } from './haulerTeach';
import { blockTeach } from './blockTeach';
import { mintRing } from './mintRing';
import { tollLeak } from './tollLeak';
import { muteJam } from './muteJam';
import { flySpawn } from './flySpawn';
import { skyNote } from './skyNote';
import { leechDrinkNote } from './leechDrinkNote';
import { muteNote } from './muteNote';
import { wardDenyNote } from './wardDenyNote';
import { wardDeny } from './wardDeny';
import { bulwarkPlate } from './bulwarkPlate';
import { nameTag } from './nameTag';
import { bossArrival } from './bossArrival';
import { bossOut } from './bossOut';
import { bossPhase } from './bossPhase';
import { flyLine } from './flyLine';
import { blinkTelegraph } from './blinkTelegraph';
import { bossBack } from './bossBack';
import { dasherStreak } from './dasherStreak';
import { flyerStreak } from './flyerStreak';
import { sprinterRamp } from './sprinterRamp';
import { crackDeep } from './crackDeep';
import { split } from './split';
import { midSplit } from './midSplit';
import { hivePops } from './hivePops';
import { mendPack } from './mendPack';
import { gorgeFeeds } from './gorgeFeeds';
import { hivePopBurst } from './hivePopBurst';
import { orbSplit } from './orbSplit';
import { killCoin } from './killCoin';
import { bountyCoin } from './bountyCoin';
import { killMilestone } from './killMilestone';
import { towerMilestoneNote } from './towerMilestoneNote';
import { waveClose } from './waveClose';
import { nearMiss } from './nearMiss';
import { nearMissNote } from './nearMissNote';

/**
 * Everything that reacts to kills, leaks or every frame of a wave, one per line (see hook.ts).
 * A new one is a new file in this folder plus one line here, next to its kin.
 */
export const ENEMY_HOOKS: readonly MakeEnemyHook[] = [
  comboGold,
  comboBreakNote,
  comboBreak,
  leakEcho,
  bossEscape,
  bossDeath,
  titanShield,
  leechDrink,
  shieldDown,
  split,
  midSplit,
  hivePops,
  mendPack,
  gorgeFeeds,
  hivePopBurst,
  orbSplit,
  nameTag,
  bossArrival,
  bossOut,
  bossPhase,
  flyLine,
  blinkTelegraph,
  bossBack,
  dasherStreak,
  flyerStreak,
  sprinterRamp,
  crackDeep,
  killCoin,
  bountyCoin,
  killMilestone,
  towerMilestoneNote,
  waveClose,
  nearMiss,
  nearMissNote,
  haulerLeakNote,
  haulerLeak,
  haulerTeach,
  blockTeach,
  tollLeak,
  burnLeap,
  muteJam,
  flySpawn,
  skyNote,
  leechDrinkNote,
  muteNote,
  wardDenyNote,
  wardDeny,
  bulwarkPlate,
  mintRing,
];
