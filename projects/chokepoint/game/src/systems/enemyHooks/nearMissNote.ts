import { CELL } from '../../config';
import type { WaveSystem } from '../WaveSystem';
import type { MakeEnemyHook } from './hook';

/** The wave's last kill within 1.5 cells of the exit plays the soft near-miss note — the nearMiss
 *  hook's own trigger (T0271); an ordinary kill or a leak plays nothing (the leak thud is onLeak's). */
export const nearMissNote: MakeEnemyHook = (ctx) => ({
  onKill({ enemy }) {
    const waves = ctx.scene.registry.get('waves') as WaveSystem | undefined;
    if (!waves || !waves.spawningDone || ctx.run.over) return;
    if (ctx.enemies.aliveCount !== 1) return; // the dead enemy is still counted while onKill runs
    if (enemy.remaining > 1.5 * CELL) return; // its own route: a flyer's crossing, not the road
    ctx.sfx?.nearMiss();
  },
});
