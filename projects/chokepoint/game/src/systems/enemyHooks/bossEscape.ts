import { bossId } from '../../core/waves';
import type { MakeEnemyHook } from './hook';

/**
 * The boss's escape: when the leaker is the enemy the current wave's plan declares as its boss,
 * one low descending horn plays, on top of the leak's other feedback (the jolt, the echo ghost,
 * the thud, the Toll gold and the last-stand banner all still land). A non-boss leaker is
 * byte-identical to today; a boss wave sends at most one boss, so at most one note per wave.
 * Live-run only: the note plays at the leak's moment, like the thud; a resumed run replays nothing.
 */
export const bossEscape: MakeEnemyHook = ({ run, sfx }) => ({
  onLeak(enemy) {
    const boss = bossId(run.wave);
    if (boss !== undefined && enemy.def.id === boss) sfx?.bossEscape();
  },
});
