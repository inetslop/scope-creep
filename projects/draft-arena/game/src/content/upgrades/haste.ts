import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const haste: UpgradeDef = {
  id: 'haste',
  name: 'Haste',
  description: 'Every weapon fires 8% sooner, per rank.',
  maxLevel: 5,
  look: { shape: 'star', color: PALETTE.yellow },
  stats: { cooldown: -0.08 },
};
