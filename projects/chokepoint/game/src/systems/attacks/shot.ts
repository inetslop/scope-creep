import { pickTarget } from '../../core/targeting';
import type { Attack } from './attack';

/** A volley: every shot at the enemy furthest along, each from its own barrel. */
export const shot: Attack = ({ tower, enemies, range, payload, fireBolt, sfx }) => {
  const t = pickTarget(tower.x, tower.y, range, enemies);
  if (t < 0) return false;
  const first = enemies[t]!;
  tower.aimAt(first.x, first.y);
  tower.kick();
  for (let n = 0; n < tower.spec.shots; n++) fireBolt(n, first, payload);
  sfx?.shoot();
  return true;
};
