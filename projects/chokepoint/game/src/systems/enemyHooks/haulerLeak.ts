import { PALETTE } from '../../content/palette';
import type { MakeEnemyHook } from './hook';

/**
 * The Hauler's leak: the 5 gold it costs (gold never goes below 0), with its red "-5" pop at
 * the exit, next to the leak's own life pop (the jolt and the sound are the usual leak's).
 */
export const haulerLeak: MakeEnemyHook = ({ run, fx }) => ({
  onLeak(enemy) {
    if (enemy.def.id !== 'hauler') return;
    run.gold = Math.max(0, run.gold - 5);
    fx.popText(enemy.x + 40, enemy.y - 20, '-5', PALETTE.red);
  },
});
