import { PALETTE } from '../palette';
import type { WeaponDef } from '../types';

/** Unlocked by the Line upgrade: slow blue lines that pierce several enemies. */
export const line: WeaponDef = {
  id: 'line',
  name: 'Line',
  description: 'Slow lines that pierce several enemies.',
  fireRate: 1.1,
  count: 1,
  spreadDeg: 0,
  jitterDeg: 0,
  damage: 16,
  speed: 380,
  lifetimeSec: 1.4,
  pierce: 4,
  knockback: 40,
  look: {
    length: 30,
    width: 6,
    color: PALETTE.blue,
  },
};
