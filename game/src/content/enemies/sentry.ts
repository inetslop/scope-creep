import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** Ranged enemy: an orange pentagon that holds its distance and fires slow ink points. */
export const sentry: EnemyDef = {
  id: 'sentry',
  name: 'Sentry',
  hp: 30,
  speed: 85,
  contactDamage: 8,
  xp: 3,
  threat: 3,
  spawnWeight: 3,
  unlockAtSec: 60,
  behavior: 'shoot',
  knockbackResist: 0.3,
  look: {
    shape: 'pentagon',
    radius: 16,
    body: PALETTE.orange,
    accent: PALETTE.paperLight,
    spin: 0.5,
  },
};
