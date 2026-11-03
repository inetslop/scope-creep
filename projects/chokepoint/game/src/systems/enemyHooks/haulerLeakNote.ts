import type { MakeEnemyHook } from './hook';

/**
 * The Hauler's leak pays its note: the moment its 5-gold cost takes gold, one soft falling
 * two-note coin blip (Sfx.haulerLeak, G4 to E4, 0.08 pre-master, the Ward note's class, the
 * run's quietest, under the hit blip) at the exit — one per leak. It reads the leaker's type
 * and the run's gold BEFORE haulerLeak (below) takes the 5 gold, so a leak at 0 gold (the cost
 * takes nothing) plays nothing, and no other leaker ever does. Silent with the sound toggle
 * off (Sfx.tone is). It draws nothing: the leak's chip, thud, jolt and echo stay the others'.
 */
export const haulerLeakNote: MakeEnemyHook = ({ run, sfx }) => ({
  onLeak(enemy) {
    if (enemy.def.id !== 'hauler' || run.gold <= 0) return;
    sfx?.haulerLeak();
  },
});
