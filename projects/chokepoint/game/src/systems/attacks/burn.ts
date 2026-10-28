import { pickTarget } from '../../core/targeting';
import type { Attack } from './attack';

/** Sets ablaze the enemy furthest along (no damage of its own; the burn keeps ticking after). */
export const burn: Attack = ({ tower, enemies, range, payload, strike }) => {
  if (!payload.burn) return false;
  const i = pickTarget(tower.x, tower.y, range, enemies);
  if (i === -1) return false;
  const target = enemies[i]!;
  tower.aimAt(target.x, target.y);
  tower.kick();
  strike(target, payload);
  return true;
};
