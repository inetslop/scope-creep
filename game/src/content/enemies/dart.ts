import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** Fast, fragile black diamond that weaves as it approaches. */
export const dart: EnemyDef = {
  id: 'dart',
  name: 'Dart',
  note: 'BLACK AND QUICK',
  hp: 9,
  speed: 150,
  contactDamage: 6,
  xp: 2,
  threat: 1.5,
  spawnWeight: 5,
  unlockAtSec: 40,
  behavior: 'weaver',
  knockbackResist: 0,
  look: {
    shape: 'diamond',
    radius: 12,
    body: PALETTE.ink,
    accent: PALETTE.yellow,
  },
};
