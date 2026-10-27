import { PALETTE } from '../palette';
import type { PressBossDef } from './types';

/** The fourth boss: a 70 u ink wall that advances down the page, printing rows of type blocks. */
export const PRESS: PressBossDef = {
  id: 'press',
  name: 'THE PRESS',
  behavior: 'press',
  hp: 520,
  speed: 40, // unused: the wall does not drift toward the player
  contactDamage: 8, // the wall's burn, per second, while in contact (core/run.ts: drain)
  bodyRadius: 35, // half the band thickness; nominal (the wall uses a full-width rect body)
  coreSize: 0, // unused: the press has no core
  deathXp: 30,
  deathPickups: 10,
  bandThickness: 70,
  blockHp: 30, // flat: only the 520 wall HP scales per respawn
  blockSize: 24,
  blockContactDamage: 4,
  look: { body: PALETTE.ink, core: PALETTE.paperLight },
};
