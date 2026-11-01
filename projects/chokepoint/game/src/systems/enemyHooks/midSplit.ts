import { CELL } from '../../config';
import { getEnemy } from '../../content/enemies';
import { splitDistances } from '../../core/split';
import { atSplitLine, splitChildHp } from '../../core/midSplit';
import type { Enemy } from '../../entities/Enemy';
import { clearRing } from '../fx/clearRing';
import type { MakeEnemyHook } from './hook';

/** The window's length, seconds: the Orb's white flash before it breaks into its Shards (T0347). */
export const SPLIT_TELEGRAPH_SEC = 0.4;

/**
 * The mid-life split (the Orb): the first hit that drops it to its split line opens the window —
 * the `SPLIT_TELEGRAPH_SEC` it flashes white and keeps walking and taking hits, never killed
 * (its look, systems/enemyHooks/orbSplit.ts) — and at its end it is gone with no kill: no
 * gold, no combo, no onKill, no name tag, no Toll, no count — a soft white ring at its spot
 * (T0229), and two of its piece at its road position, 0.25 cells either side (core/split.ts),
 * each with half of its hp when the window opened (core/midSplit.ts).
 */
export const midSplit: MakeEnemyHook = ({ board, enemies, fx }) => {
  const hpAt = new Map<Enemy, number>(); // the hp the triggering hit left: the Shards' share
  return {
    update(dt) {
      for (const e of enemies.all) {
        if (!e.active || e.def.splitsAt === undefined) continue;
        if (e.splitClock < 0) {
          if (!atSplitLine(e.def, e.hp, e.maxHp)) continue; // the first drop to the line opens it
          e.splitClock = 0;
          hpAt.set(e, e.hp);
        }
        e.splitClock += dt; // once open it runs on the sim clock, even at hp 0: the split, not a kill, ends it
        if (e.splitClock < SPLIT_TELEGRAPH_SEC) continue;
        const child = getEnemy(e.def.splitsAt!.into); // atSplitLine guarantees it
        const half = splitChildHp(hpAt.get(e) ?? e.hp);
        const x = e.x, y = e.y, d = e.distance, size = e.def.look.size * CELL, sm = e.speedMul, wm = e.waveSpeedMul; // capture before spawning: spawn may recycle this slot
        e.despawn();
        hpAt.delete(e); // gone with no kill: no gold, no combo, no onKill, no name tag, no Toll, no count
        for (const dd of splitDistances(d, board.path.length)) enemies.spawn(child, half / child.hp, sm, wm, dd);
        clearRing(fx, x, y, size); // T0229's soft white ring, 300 ms
      }
    },
    onKill({ enemy }) { hpAt.delete(enemy); },
    onLeak(enemy) { hpAt.delete(enemy); },
  };
};
