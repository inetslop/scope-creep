import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Sells cushion for teeth: less max hp, harder hits from every weapon. */
export const frenzy: UpgradeDef = {
  id: 'frenzy',
  name: 'Frenzy',
  description: 'Trade 8 max hp for 12% damage, per rank.',
  maxLevel: 3,
  look: { shape: 'pentagon', color: PALETTE.red },
  stats: { maxHp: -8, damage: 0.12 },
};
