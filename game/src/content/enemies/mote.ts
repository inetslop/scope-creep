import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** A tiny fast swarm circle that appears in numbers mid-run. Ink body, paper eye. */
export const mote: EnemyDef = {
  id: 'mote',
  name: 'Mote',
  hp: 6,
  speed: 150,
  contactDamage: 4,
  xp: 1,
  threat: 1,
  spawnWeight: 8,
  unlockAtSec: 45,
  behavior: 'chase',
  knockbackResist: 0,
  look: {
    shape: 'circle',
    radius: 7,
    body: PALETTE.ink,
    accent: PALETTE.paperLight,
    spin: 0,
  },
};
