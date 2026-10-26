import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** The basic fodder enemy: a red triangle that points itself at the player and charges in. */
export const wedge: EnemyDef = {
  id: 'wedge',
  name: 'Wedge',
  hp: 14,
  speed: 95,
  contactDamage: 8,
  xp: 1,
  threat: 1,
  spawnWeight: 10,
  unlockAtSec: 0,
  behavior: 'chase',
  knockbackResist: 0,
  look: {
    shape: 'triangle',
    radius: 15,
    body: PALETTE.red,
    accent: PALETTE.paperLight,
  },
};
