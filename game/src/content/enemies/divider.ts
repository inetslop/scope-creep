import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** Late-run harasser: a small ink hexagon that holds close range and fires fast, light ink points. */
export const divider: EnemyDef = {
  id: 'divider',
  name: 'Divider',
  note: 'IT HOLDS ITS DISTANCE',
  hp: 16,
  speed: 170,
  contactDamage: 8,
  xp: 2,
  threat: 2,
  spawnWeight: 4,
  unlockAtSec: 200,
  behavior: 'shoot',
  knockbackResist: 0.2,
  shoot: { periodSec: 1.4, speed: 260, damage: 6, bandNear: 140, bandFar: 190 },
  look: {
    shape: 'hexagon',
    radius: 13,
    body: PALETTE.ink,
    accent: PALETTE.paperLight,
    spin: 0.8,
  },
};
