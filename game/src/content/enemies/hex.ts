import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** Mid-game fodder: a green hexagon that spins as it chases. Tougher and faster than the wedge. */
export const hex: EnemyDef = {
  id: 'hex',
  name: 'Hex',
  note: 'GREEN CLOSING IN',
  hp: 20,
  speed: 115,
  contactDamage: 10,
  xp: 2,
  threat: 2,
  spawnWeight: 4,
  unlockAtSec: 20,
  behavior: 'chase',
  knockbackResist: 0.2,
  look: {
    shape: 'hexagon',
    radius: 15,
    body: PALETTE.green,
    accent: PALETTE.paperLight,
    spin: -1.5,
  },
};
