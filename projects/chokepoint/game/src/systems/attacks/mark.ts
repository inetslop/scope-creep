import type { Enemy } from '../../entities/Enemy';
import type { Attack } from './attack';

/**
 * Index of the enemy in range that is furthest along the path and not already marked, or -1.
 * A local copy of core/targeting's pickTarget (which belongs to targeting, not to this attack):
 * marked enemies are skipped, so every tick marks a new enemy.
 */
function furthestUnmarked(x: number, y: number, range: number, enemies: readonly Enemy[]): number {
  let best = -1;
  let bestDistance = -Infinity;
  const r2 = range * range;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]!;
    if (!e.active || e.markPct > 0 || e.untargetable) continue;
    const dx = e.x - x;
    const dy = e.y - y;
    if (dx * dx + dy * dy > r2) continue;
    if (e.distance > bestDistance) {
      best = i;
      bestDistance = e.distance;
    }
  }
  return best;
}

/** Marks the unmarked enemy furthest along (no damage of its own; the mark makes everything hurt it more). */
export const mark: Attack = ({ tower, enemies, range, payload, strike, sfx }) => {
  const i = furthestUnmarked(tower.x, tower.y, range, enemies);
  if (i === -1 || !payload.mark) return false;
  strike(enemies[i]!, payload);
  sfx?.mark();
  return true;
};
