import { PALETTE } from '../palette';
import type { WeaponDef } from '../types';

/** Starting weapon: rapid ink points fired where you aim. */
export const point: WeaponDef = {
  id: 'point',
  name: 'Point',
  description: 'Fires ink points where you aim.',
  fireRate: 4,
  count: 1,
  spreadDeg: 10,
  jitterDeg: 3,
  damage: 7,
  speed: 620,
  lifetimeSec: 0.9,
  pierce: 0,
  knockback: 90,
  look: {
    length: 9,
    width: 9,
    color: PALETTE.ink,
  },
};
