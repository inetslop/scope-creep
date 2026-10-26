import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** Small fast punisher: a red spinning triangle that chases. Hugging the swarm gets you stung. */
export const spike: EnemyDef = {
  id: 'spike',
  name: 'Spike',
  hp: 10,
  speed: 130,
  contactDamage: 14,
  xp: 2,
  threat: 2,
  spawnWeight: 5,
  unlockAtSec: 75,
  behavior: 'chase',
  knockbackResist: 0.1,
  look: {
    shape: 'triangle',
    radius: 10,
    body: PALETTE.red,
    accent: PALETTE.paperLight,
    spin: 1.5,
  },
};
