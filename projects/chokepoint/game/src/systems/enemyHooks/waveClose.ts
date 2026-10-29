import { CELL } from '../../config';
import { clearRing } from '../fx/clearRing';
import type { WaveSystem } from '../WaveSystem';
import type { MakeEnemyHook } from './hook';

/** The wave's last kill blooms clearRing at the kill spot - the same beat as the cleared text (RunFlow). */
export const waveClose: MakeEnemyHook = (ctx) => ({
  onKill({ enemy }) {
    const waves = ctx.scene.registry.get('waves') as WaveSystem | undefined;
    if (!waves || !waves.spawningDone || ctx.run.over) return;
    if (ctx.enemies.aliveCount !== 1) return; // the dead enemy is still counted while onKill runs
    clearRing(ctx.fx, enemy.x, enemy.y, enemy.def.look.size * CELL);
  },
});
