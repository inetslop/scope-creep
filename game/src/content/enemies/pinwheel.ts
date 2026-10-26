import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** Late-run chaser: a red square that spins fast as it closes in. */
export const pinwheel: EnemyDef = {
  id: 'pinwheel',
  name: 'Pinwheel',
  note: 'SPINS AS IT CHASES',
  hp: 24,
  speed: 112,
  contactDamage: 11,
  xp: 2,
  threat: 2,
  spawnWeight: 4,
  unlockAtSec: 165,
  behavior: 'chase',
  knockbackResist: 0.3,
  look: {
    shape: 'square',
    radius: 14,
    body: PALETTE.red,
    accent: PALETTE.ink,
    spin: 2.4,
  },
};
