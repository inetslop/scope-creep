import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** Heavy late-game chaser. A big yellow circle that slowly plows in and barely flinches. */
export const boulder: EnemyDef = {
  id: 'boulder',
  name: 'Boulder',
  hp: 60,
  speed: 60,
  contactDamage: 15,
  xp: 4,
  threat: 3,
  spawnWeight: 3,
  unlockAtSec: 90,
  behavior: 'chase',
  knockbackResist: 0.6,
  look: {
    shape: 'circle',
    radius: 22,
    body: PALETTE.yellow,
    accent: PALETTE.ink,
    spin: 0,
  },
};
