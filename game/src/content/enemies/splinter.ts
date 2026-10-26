import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** A fast, fragile shard of a Splitter. Never spawned by the director (spawnWeight 0) — only by splits. */
export const splinter: EnemyDef = {
  id: 'splinter',
  name: 'Splinter',
  note: 'BORN ALREADY FAST',
  hp: 8,
  speed: 130,
  contactDamage: 6,
  xp: 1,
  threat: 1,
  spawnWeight: 0,
  unlockAtSec: 0,
  behavior: 'chase',
  knockbackResist: 0,
  look: {
    shape: 'triangle',
    radius: 9,
    body: PALETTE.red,
    accent: PALETTE.paperLight,
  },
};
