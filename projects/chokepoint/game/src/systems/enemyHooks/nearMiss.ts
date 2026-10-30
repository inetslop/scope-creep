import { CELL } from '../../config';
import { nameLabel } from '../fx/nameLabel';
import type { WaveSystem } from '../WaveSystem';
import type { MakeEnemyHook } from './hook';

/** A wave whose last kill dies within 1.5 cells of the exit: the name tag's chip says "close" above the kill spot. */
export const nearMiss: MakeEnemyHook = (ctx) => ({
  onKill({ enemy }) {
    const waves = ctx.scene.registry.get('waves') as WaveSystem | undefined;
    if (!waves || !waves.spawningDone || ctx.run.over) return;
    if (ctx.enemies.aliveCount !== 1) return; // the dead enemy is still counted while onKill runs
    if (ctx.board.path.length - enemy.distance > 1.5 * CELL) return;
    nameLabel(ctx.fx, enemy.x, enemy.y, 'close');
  },
});
