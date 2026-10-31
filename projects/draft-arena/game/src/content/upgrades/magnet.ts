import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const magnet: UpgradeDef = {
  id: 'magnet',
  name: 'Magnet',
  description: 'Gems fly to you from 45 further away, per rank.',
  maxLevel: 3,
  look: { shape: 'diamond', color: PALETTE.green },
  stats: { pickup: 45 },
};
