import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** A pale blue circle that chases the player and wets the paper behind it: each puddle it drops slows the player. */
export const wash: EnemyDef = {
  id: 'wash',
  name: 'Wash',
  note: 'LEAVES THE PAGE WET',
  hp: 35,
  speed: 55,
  contactDamage: 6,
  xp: 2,
  threat: 2,
  spawnWeight: 4,
  unlockAtSec: 120,
  behavior: 'chase',
  knockbackResist: 0.3,
  look: {
    shape: 'circle',
    radius: 14,
    body: PALETTE.blueLight,
    accent: PALETTE.ink,
  },
  puddle: {
    periodSec: 2,
    radius: 60,
    lifeSec: 2,
    fadeSec: 0.5,
    maxAlive: 3,
    slowMul: 0.8,
  },
};
