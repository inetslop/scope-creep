import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const reach: UpgradeDef = {
  id: 'reach',
  name: 'Reach',
  description: 'Shots fly 15% faster, and so 15% further. Per rank.',
  maxLevel: 3,
  look: { shape: 'triangle', color: PALETTE.blue },
  stats: { projectileSpeed: 0.15 },
};
