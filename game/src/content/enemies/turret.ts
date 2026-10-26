import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** Static enemy: a small orange square that never moves and fires fast ink points. */
export const turret: EnemyDef = {
  id: 'turret',
  name: 'Turret',
  note: 'HOLDS STILL, SHOTS FAST',
  hp: 50,
  speed: 0,
  contactDamage: 10,
  xp: 4,
  threat: 3,
  spawnWeight: 3,
  unlockAtSec: 150,
  behavior: 'shoot',
  knockbackResist: 0.9,
  shoot: { periodSec: 1.2, speed: 220, damage: 10 },
  look: { shape: 'square', radius: 18, body: PALETTE.orange, accent: PALETTE.ink, spin: 0.5 },
};
