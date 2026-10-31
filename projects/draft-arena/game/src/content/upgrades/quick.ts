import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const quick: UpgradeDef = {
  id: 'quick',
  name: 'Quick',
  description: 'Shots fly 15% faster, per rank.',
  maxLevel: 3,
  look: { shape: 'diamond', color: PALETTE.blue },
  stats: { projectileSpeed: 0.15 },
};
