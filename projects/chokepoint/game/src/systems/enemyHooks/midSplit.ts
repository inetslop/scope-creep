import { CELL } from '../../config';
import { getEnemy } from '../../content/enemies';
import { splitDistances } from '../../core/split';
import { atSplitLine, splitChildHp } from '../../core/midSplit';
import { clearRing } from '../fx/clearRing';
import type { MakeEnemyHook } from './hook';

/**
 * The mid-life split (the Orb): at its split line, still alive, it is gone with no kill — no
 * gold, no combo, no onKill, no name tag, no Toll, no count — a soft white ring at its spot
 * (T0229), and two of its piece at its road position, 0.25 cells either side (core/split.ts),
 * each with half its hp after the triggering hit (core/midSplit.ts).
 */
export const midSplit: MakeEnemyHook = ({ board, enemies, fx }) => ({
  update() {
    for (const e of enemies.all) {
      if (!e.active || !atSplitLine(e.def, e.hp, e.maxHp)) continue;
      const child = getEnemy(e.def.splitsAt!.into); // atSplitLine guarantees it
      const half = splitChildHp(e.hp);
      const x = e.x, y = e.y, d = e.distance, size = e.def.look.size * CELL, sm = e.speedMul; // capture before spawning: spawn may recycle this slot
      e.despawn(); // gone with no kill: no gold, no combo, no onKill, no name tag, no Toll, no count
      for (const dd of splitDistances(d, board.path.length)) enemies.spawn(child, half / child.hp, sm, dd);
      clearRing(fx, x, y, size); // T0229's soft white ring, 300 ms
    }
  },
});
