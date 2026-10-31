import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const swift: UpgradeDef = {
  id: 'swift',
  name: 'Swift',
  description: '+20 move speed per rank.',
  maxLevel: 5,
  look: { shape: 'triangle', color: PALETTE.green },
  stats: { speed: 20 },
};
