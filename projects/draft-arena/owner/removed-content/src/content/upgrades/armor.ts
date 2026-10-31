import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const armor: UpgradeDef = {
  id: 'armor',
  name: 'Armor',
  description: 'Every hit on you is 2 weaker. Per rank.',
  maxLevel: 3,
  look: { shape: 'hexagon', color: PALETTE.green },
  stats: { armor: 2 },
};
