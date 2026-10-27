import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** Heavy late-run shooter: a big slow orange circle that holds close and fires slow, heavy ink points. */
export const counterweight: EnemyDef = {
  id: 'counterweight',
  name: 'Counterweight',
  note: 'SLOW AND HEAVY SHOTS',
  hp: 120,
  speed: 30,
  contactDamage: 14,
  xp: 6,
  threat: 4,
  spawnWeight: 3,
  unlockAtSec: 195,
  behavior: 'shoot',
  knockbackResist: 0.5,
  shoot: { periodSec: 3, speed: 130, damage: 12, bandNear: 200, bandFar: 260 },
  look: { shape: 'circle', radius: 32, body: PALETTE.orange, accent: PALETTE.paperLight, spin: 0.5 },
};
