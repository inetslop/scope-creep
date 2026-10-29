import { pickTarget } from '../../core/targeting';
import type { Attack } from './attack';

/** A Spray: one bolt at the enemy furthest along; on its first hit the bolt splits into homing needles (ProjectileSystem). */
export const spray: Attack = ({ tower, enemies, range, payload, fireBolt, sfx }) => {
  const i = pickTarget(tower.x, tower.y, range, enemies);
  if (i < 0) return false;
  const target = enemies[i]!;
  tower.aimAt(target.x, target.y);
  tower.kick();
  fireBolt(0, target, payload);
  sfx?.shoot();
  return true;
};
