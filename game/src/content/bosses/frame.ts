import { PALETTE } from '../palette';
import type { FrameBossDef } from './types';

/** The first boss: a giant picture frame that drifts in, charges, and scatters ink. */
export const FRAME: FrameBossDef = {
  id: 'frame',
  name: 'THE FRAME',
  behavior: 'frame',
  hp: 1200,
  speed: 40,
  contactDamage: 20,
  bodyRadius: 80,
  coreSize: 40,
  dashContactDamage: 25,
  frameSize: 160,
  frameThickness: 10,
  dashSpeed: 400,
  dashDurationSec: 0.8,
  attackCycleSec: 4,
  telegraphSec: 0.6,
  ringCount: 10,
  ringRadius: 120,
  burstCount: 12,
  deathXp: 30,
  deathPickups: 10,
  ringEnemyId: 'frame-wedge',
  look: { body: PALETTE.ink, core: PALETTE.red },
};
