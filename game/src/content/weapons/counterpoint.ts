import { PALETTE } from '../palette';
import type { WeaponDef } from '../types';

/** A point that bounces off the arena walls, so you can punish the edges without re-aiming. */
export const counterpoint: WeaponDef = {
  id: 'counterpoint',
  name: 'Counterpoint',
  description: 'Fires an ink point that bounces off the arena walls.',
  fireRate: 1.25, // one point every 0.8 s
  count: 1,
  spreadDeg: 0,
  jitterDeg: 0,
  damage: 14,
  speed: 260,
  lifetimeSec: 3,
  pierce: 0,
  knockback: 40,
  look: { length: 10, width: 10, color: PALETTE.ink }, // equal length/width = round point, radius 5
  bounce: { maxBounces: 2, damageMul: 0.75 },
};
