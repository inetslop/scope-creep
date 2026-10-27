import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** The quickener: a small green circle that starts sluggish and runs faster every quarter of its HP it loses. */
export const hare: EnemyDef = {
  id: 'hare',
  name: 'Hare',
  note: 'QUICKER AS IT WEAKENS',
  hp: 24,
  speed: 40,
  contactDamage: 8,
  xp: 2,
  threat: 2,
  spawnWeight: 4,
  unlockAtSec: 100,
  behavior: 'quicken',
  knockbackResist: 0.1,
  look: {
    shape: 'circle',
    radius: 12,
    body: PALETTE.green,
    accent: PALETTE.ink,
  },
};
