import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** Huge slow wall for late runs. A big yellow square that barely moves and hurts to touch. */
export const slab: EnemyDef = {
  id: 'slab',
  name: 'Slab',
  note: 'A WALL THAT CRAWLS',
  hp: 140,
  speed: 45,
  contactDamage: 18,
  xp: 6,
  threat: 4,
  spawnWeight: 2,
  unlockAtSec: 120,
  behavior: 'chase',
  knockbackResist: 0.8,
  look: {
    shape: 'square',
    radius: 24,
    body: PALETTE.yellow,
    accent: PALETTE.ink,
    spin: 0.1,
  },
};
