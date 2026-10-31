import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const might: UpgradeDef = {
  id: 'might',
  name: 'Might',
  description: '+12% damage per rank.',
  maxLevel: 5,
  look: { shape: 'pentagon', color: PALETTE.red },
  stats: { damage: 0.12 },
};
