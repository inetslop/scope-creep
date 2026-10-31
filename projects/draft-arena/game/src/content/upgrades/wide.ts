import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const wide: UpgradeDef = {
  id: 'wide',
  name: 'Wide',
  description: 'The splash is 20% bigger, per rank.',
  maxLevel: 3,
  look: { shape: 'hexagon', color: PALETTE.teal },
  stats: { area: 0.2 },
};
