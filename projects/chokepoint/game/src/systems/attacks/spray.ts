import { pickTarget } from '../../core/targeting';
import type { Attack } from './attack';

/** A Spray: a blast of straight pellets in a cone at the enemy furthest along (ProjectileSystem flies them). */
export const spray: Attack = ({ tower, enemies, range, payload, firePellets, sfx }) => {
  const i = pickTarget(tower.x, tower.y, range, enemies);
  if (i < 0) return false;
  const target = enemies[i]!;
  tower.aimAt(target.x, target.y);
  tower.kick();
  firePellets(target, tower.spec.spray, payload, range);
  sfx?.shoot();
  return true;
};
