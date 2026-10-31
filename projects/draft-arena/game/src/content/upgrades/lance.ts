import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const lance: UpgradeDef = {
  id: 'lance',
  name: 'Lance',
  description: 'Bolts go through 1 more enemy, per rank.',
  maxLevel: 2,
  look: { shape: 'diamond', color: PALETTE.blue },
  stats: { pierce: 1 },
};
