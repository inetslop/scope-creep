import { CELL } from '../../config';
import { leadAim } from '../../core/lead';
import { pickTargets } from '../../core/targeting';
import type { Attack } from './attack';

/** Bolts at the enemies furthest along: one per shot, each from its own barrel. */
export const shot: Attack = ({ tower, enemies, range, payload, fireBolt, sfx }) => {
  const targets = pickTargets(tower.x, tower.y, range, enemies, tower.spec.shots);
  if (targets.length === 0) return false;
  const first = enemies[targets[0]!]!;
  // With a Lead in the tower the barrels point where the first target is going, not where it is.
  const aim = tower.spec.lead > 0 ? leadAim(tower.x, tower.y, first, tower.spec.projectileSpeed * CELL, tower.spec.lead) : undefined;
  tower.aimAt(aim?.x ?? first.x, aim?.y ?? first.y);
  tower.kick();
  targets.forEach((target, n) => fireBolt(n, enemies[target]!, payload));
  sfx?.shoot();
  return true;
};
