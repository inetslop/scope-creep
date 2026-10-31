import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const split: UpgradeDef = {
  id: 'split',
  name: 'Split',
  description: 'Every weapon fires 1 more shot, fanned out; all shots 12% weaker. Per rank.',
  maxLevel: 2,
  look: { shape: 'triangle', color: PALETTE.yellow },
  stats: { shots: 1, damage: -0.12 },
};
