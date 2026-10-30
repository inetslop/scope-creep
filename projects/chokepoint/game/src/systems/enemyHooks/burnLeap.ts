import { CELL } from '../../config';
import type { Enemy } from '../../entities/Enemy';
import { burnSpark } from '../fx/spark';
import type { MakeEnemyHook } from './hook';

/** Burn on death: the burn leaps to the nearest living enemy within 2 cells; a leaped burn only leaps once. */
export const burnLeap: MakeEnemyHook = ({ enemies, fx }) => {
  // Mark is on the host, keyed by its spawn serial: pooled Enemy objects are reused, so a bare
  // Set<Enemy> would later suppress the leap of an enemy that never leaped.
  const jumped = new WeakMap<Enemy, number>();
  return {
    onKill({ enemy }) {
      if (enemy.burn.left <= 0) return; // unburned death: unchanged
      if (jumped.get(enemy) === enemy.serial) return; // a leaped burn never leaps again
      const r2 = (2 * CELL) ** 2; // the same 2-cell circle as the Mint and Rally auras
      let best: Enemy | undefined;
      let bestD = r2;
      for (const e of enemies.all) {
        if (!e.active || e === enemy) continue; // dead/returned hosts, and the dying enemy
        const dx = e.x - enemy.x;
        const dy = e.y - enemy.y;
        const d = dx * dx + dy * dy;
        if (d <= bestD) { bestD = d; best = e; }
      }
      if (!best) return;
      jumped.set(best, best.serial);
      best.ignite(enemy.burn.dps, 3, enemy.burn.mul); // fresh 3 s at the dying burn's rate and multiplier (re-ignition keeps the hotter)
      burnSpark(fx, enemy.x, enemy.y, best.x, best.y);
    },
  };
};
