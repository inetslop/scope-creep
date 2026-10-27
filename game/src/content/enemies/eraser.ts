import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** Late-run paper-white block: on contact it erases the player's most recent upgrade, then crumples into paper. */
export const eraser: EnemyDef = {
  id: 'eraser',
  name: 'Eraser',
  note: 'TAKES YOUR LAST UPGRADE',
  hp: 40,
  speed: 55,
  contactDamage: 8,
  xp: 6,
  threat: 3,
  spawnWeight: 2,
  unlockAtSec: 180,
  behavior: 'chase',
  knockbackResist: 0.4,
  contact: 'erase',
  look: {
    shape: 'rect',
    radius: 13,
    body: PALETTE.paperLight,
    accent: PALETTE.ink,
    spin: 0.5,
    outlineWidth: 3,
  },
};
