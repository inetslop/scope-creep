import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** Red wedge spawned in a ring by The Frame's ring attack. The director never spawns it (spawnWeight 0). */
export const frameWedge: EnemyDef = {
  id: 'frame-wedge',
  name: 'Frame Wedge',
  hp: 10,
  speed: 160,
  contactDamage: 8,
  xp: 1,
  threat: 1,
  spawnWeight: 0,
  unlockAtSec: 300,
  behavior: 'chase',
  knockbackResist: 0,
  look: {
    shape: 'triangle',
    radius: 15,
    body: PALETTE.red,
    accent: PALETTE.paperLight,
  },
};
