import { PALETTE } from '../palette';
import type { PaletteBossDef } from './types';

/** The third boss: a thin ink rail across the top of the page, five color swatches docked in it. */
export const PALETTE_BOSS: PaletteBossDef = {
  id: 'palette',
  name: 'THE PALETTE',
  behavior: 'palette',
  hp: 450, // 5 swatches x 90; keep in sync with swatchHp (see content tests)
  speed: 40,
  contactDamage: 12, // the falling swatch's contact, used by onPlayerTouched
  bodyRadius: 30, // half a swatch's width; the palette uses a rect body
  coreSize: 0, // unused: the palette has no core
  deathXp: 30,
  deathPickups: 10,
  swatchHp: 90,
  swatchWidth: 60,
  swatchHeight: 30,
  swatchColors: [PALETTE.red, PALETTE.orange, PALETTE.yellow, PALETTE.green, PALETTE.blue],
  shardCount: 6,
  look: { body: PALETTE.ink, core: PALETTE.paperLight },
};
