import { pickTargets } from '../../core/targeting';
import type { Attack } from './attack';

/** Bolts at the enemies furthest along: one per shot, each from its own barrel. */
export const shot: Attack = ({ tower, enemies, range, payload, fireBolt, sfx }) => {
  const targets = pickTargets(tower.x, tower.y, range, enemies, tower.spec.shots);
  if (targets.length === 0) return false;
  const first = enemies[targets[0]!]!;
  tower.aimAt(first.x, first.y);
  tower.kick();
  targets.forEach((target, n) => fireBolt(n, enemies[target]!, payload));
  sfx?.shoot();
  return true;
};
