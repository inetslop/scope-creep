import { PALETTE } from '../palette';
import type { WeaponDef } from '../types';

/** Unlocked by the Orbit upgrade: 3 circles that orbit the player and damage enemies on contact. */
export const orbit: WeaponDef = {
  id: 'orbit',
  name: 'Orbit',
  description: '3 circles that orbit you and damage enemies on contact.',
  fireRate: 1,
  count: 1,
  spreadDeg: 0,
  jitterDeg: 0, // projectile fields unused for orbit weapons, required by the type
  damage: 12,
  speed: 0,
  lifetimeSec: 0,
  pierce: 0,
  knockback: 90,
  look: {
    length: 8,
    width: 8,
    color: PALETTE.blue,
  },
  orbit: { count: 3, radius: 70, speed: 2.5, circleRadius: 8, hitCooldownSec: 0.6 },
};
