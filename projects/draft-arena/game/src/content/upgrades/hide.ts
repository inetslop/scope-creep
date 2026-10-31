import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const hide: UpgradeDef = {
  id: 'hide',
  name: 'Hide',
  description: 'Take 10% less damage, per rank.',
  maxLevel: 3,
  look: { shape: 'hexagon', color: PALETTE.green },
  stats: { armor: 10 },
};
