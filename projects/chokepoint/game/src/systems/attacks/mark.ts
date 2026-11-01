import { prefers, type TargetMode } from '../../core/targeting';
import type { Enemy } from '../../entities/Enemy';
import type { Attack } from './attack';

/**
 * Index of the enemy in range the tower's mode prefers and not already marked, or -1.
 * A local copy of core/targeting's pickTarget (which belongs to targeting, not to this attack):
 * marked enemies are skipped, so every tick marks a new enemy.
 */
function preferredUnmarked(x: number, y: number, range: number, enemies: readonly Enemy[], mode: TargetMode): number {
  let best = -1;
  const r2 = range * range;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]!;
    if (!e.active || e.markPct > 0 || e.untargetable) continue;
    const dx = e.x - x;
    const dy = e.y - y;
    if (dx * dx + dy * dy > r2) continue;
    if (best === -1 || prefers(e, enemies[best]!, mode, x, y)) best = i;
  }
  return best;
}

/** Marks the unmarked enemy the tower's mode prefers (no damage of its own; the mark makes everything hurt it more). */
export const mark: Attack = ({ tower, enemies, range, payload, strike, sfx }) => {
  const i = preferredUnmarked(tower.x, tower.y, range, enemies, tower.targetMode);
  if (i === -1 || !payload.mark) return false;
  strike(enemies[i]!, payload);
  sfx?.mark();
  return true;
};
