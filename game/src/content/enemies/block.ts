import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** Big, slow yellow square. Winds up and charges. Tanky, drops a lot of XP. */
export const block: EnemyDef = {
  id: 'block',
  name: 'Block',
  hp: 90,
  speed: 55,
  contactDamage: 18,
  xp: 8,
  threat: 7,
  spawnWeight: 2,
  unlockAtSec: 90,
  behavior: 'charger',
  knockbackResist: 0.8,
  look: {
    shape: 'square',
    radius: 26,
    body: PALETTE.yellow,
    accent: PALETTE.ink,
    spin: 0.6,
  },
};
