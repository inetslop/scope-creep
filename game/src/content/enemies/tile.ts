import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** Mid-tier chaser: a green square that closes in at medium speed. Never splits. */
export const tile: EnemyDef = {
  id: 'tile',
  name: 'Tile',
  note: 'PLAIN AND PERSISTENT',
  hp: 35,
  speed: 95,
  contactDamage: 12,
  xp: 3,
  threat: 2,
  spawnWeight: 4,
  unlockAtSec: 105,
  behavior: 'chase',
  knockbackResist: 0.3,
  look: {
    shape: 'square',
    radius: 16,
    body: PALETTE.green,
    accent: PALETTE.ink,
    spin: 0.4,
  },
};
