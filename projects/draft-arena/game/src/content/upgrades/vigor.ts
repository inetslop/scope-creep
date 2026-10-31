import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const vigor: UpgradeDef = {
  id: 'vigor',
  name: 'Vigor',
  description: '+25 max hp and +0.8 hp per second, per rank.',
  maxLevel: 5,
  look: { shape: 'circle', color: PALETTE.green },
  stats: { maxHp: 25, regen: 0.8 },
};
