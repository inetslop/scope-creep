import { inRange, pickTargets } from '../../core/targeting';
import type { Attack } from './attack';

/**
 * A wave that hits everything in range at once (Splash added already widened the range, see
 * core/augments.ts). With Bolt added it also shoots the enemies furthest along, with Bolt's damage.
 */
export const pulse: Attack = ({ tower, enemies, range, payload, fireBolt, strike, fx, sfx }) => {
  const spec = tower.spec;
  const hits = inRange(tower.x, tower.y, range, enemies);
  if (hits.length === 0) return false;
  for (const i of hits) strike(enemies[i]!, payload);
  // A damage-0 rooting pulse (Anchor) shows a flat light-blue ring instead of the colored wave.
  if (spec.damage > 0 || !spec.root) fx.wave(tower.x, tower.y, range, payload.color);
  if (spec.root) fx.rootWave(tower.x, tower.y, range);
  const bolts = spec.bolts > 0 ? pickTargets(tower.x, tower.y, range, enemies, spec.bolts) : [];
  if (bolts.length > 0) {
    const first = enemies[bolts[0]!]!;
    tower.aimAt(first.x, first.y);
    const boltPayload = { ...payload, damage: spec.boltDamage };
    bolts.forEach((target, n) => fireBolt(n, enemies[target]!, boltPayload));
  }
  tower.kick();
  sfx?.pulse();
  return true;
};
