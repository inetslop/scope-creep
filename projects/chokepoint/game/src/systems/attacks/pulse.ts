import { splashHits } from '../../core/augments';
import { inRange, pickTarget, pickTargets } from '../../core/targeting';
import type { Attack } from './attack';

/**
 * A wave that hits everything in range at once (Splash added already widened the range, see
 * core/augments.ts). A Splash first caps it at the N enemies furthest along; the others still hit
 * everything. With Bolt added it also shoots the enemy furthest along, with Bolt's damage.
 */
export const pulse: Attack = ({ tower, enemies, range, payload, fireBolt, strike, fx, sfx }) => {
  const spec = tower.spec;
  const cap = spec.firstId === 'splash' ? splashHits(spec.splashCount) : 0;
  const hits = cap > 0 ? pickTargets(tower.x, tower.y, range, enemies, cap) : inRange(tower.x, tower.y, range, enemies);
  if (hits.length === 0) return false;
  for (const i of hits) strike(enemies[i]!, payload);
  // A damage-0 rooting pulse (Anchor) shows a flat light-blue ring instead of the colored wave.
  if (spec.damage > 0 || !spec.root) fx.wave(tower.x, tower.y, range, payload.color);
  if (spec.root) fx.rootWave(tower.x, tower.y, range);
  const t = spec.bolts > 0 ? pickTarget(tower.x, tower.y, range, enemies) : -1;
  if (t >= 0) {
    const first = enemies[t]!;
    tower.aimAt(first.x, first.y);
    const boltPayload = { ...payload, damage: spec.boltDamage };
    for (let n = 0; n < spec.bolts; n++) fireBolt(n, first, boltPayload);
  }
  tower.kick();
  // A gust (Push) is a soft whoosh; a damage- or slow-pulse keeps its low blip. Per-hit pushes stay silent.
  if (spec.gust > 0) sfx?.gust(); else sfx?.pulse();
  return true;
};
