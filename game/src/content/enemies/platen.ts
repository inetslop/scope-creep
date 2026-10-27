import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** A heavy yellow circle that crawls at the player and periodically flattens and slams, shoving everything nearby (no damage). */
export const platen: EnemyDef = {
  id: 'platen',
  name: 'Platen',
  note: 'IT SHOVES',
  hp: 60,
  speed: 20,
  contactDamage: 10,
  xp: 4,
  threat: 3,
  spawnWeight: 2,
  unlockAtSec: 150,
  behavior: 'slam',
  knockbackResist: 0.5,
  look: {
    shape: 'circle',
    radius: 26,
    body: PALETTE.yellow,
    accent: PALETTE.ink,
    spin: 0.4,
  },
};
