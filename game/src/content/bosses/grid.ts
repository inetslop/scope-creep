import { PALETTE } from '../palette';
import type { GridBossDef } from './types';

/** The second boss: a rotating ink compass that drifts in and sweeps two opposite arms. */
export const GRID: GridBossDef = {
  id: 'grid',
  name: 'THE GRID',
  behavior: 'grid',
  hp: 400,
  speed: 40,
  contactDamage: 12,
  bodyRadius: 46,
  coreSize: 12,
  deathXp: 30,
  deathPickups: 10,
  spinRadPerSec: 0.5,
  armLength: 200,
  armThickness: 12,
  armDamage: 12,
  look: { body: PALETTE.paperLight, core: PALETTE.red },
};
