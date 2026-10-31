import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const pierce: UpgradeDef = {
  id: 'pierce',
  name: 'Pierce',
  description: 'Every shot passes through 1 more enemy. Per rank.',
  maxLevel: 3,
  look: { shape: 'diamond', color: PALETTE.blue },
  stats: { pierce: 1 },
};
