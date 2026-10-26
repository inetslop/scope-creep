import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** A slow, spinning red square that splits into two fast Splinters when killed. */
export const splitter: EnemyDef = {
  id: 'splitter',
  name: 'Splitter',
  note: 'IT SPLITS WHEN IT DIES',
  hp: 35,
  speed: 70,
  contactDamage: 10,
  xp: 4,
  threat: 3,
  spawnWeight: 3,
  unlockAtSec: 75,
  behavior: 'chase',
  knockbackResist: 0.4,
  splitsInto: { id: 'splinter', count: 2 },
  look: {
    shape: 'square',
    radius: 18,
    body: PALETTE.red,
    accent: PALETTE.paperLight,
    spin: 0.8,
  },
};
