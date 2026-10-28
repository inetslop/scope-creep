import { getEnemy } from '../../content/enemies';
import { splitDistances } from '../../core/split';
import type { MakeEnemyHook } from './hook';

/** A splitter dies into two splinters, 0.25 cells either side of the kill (core/split.ts). */
export const split: MakeEnemyHook = ({ board, enemies }) => ({
  onKill({ enemy }) {
    if (!enemy.def.splitsInto) return;
    const child = getEnemy(enemy.def.splitsInto);
    for (const d of splitDistances(enemy.distance, board.path.length)) enemies.spawn(child, enemy.hpMul, d);
  },
});
