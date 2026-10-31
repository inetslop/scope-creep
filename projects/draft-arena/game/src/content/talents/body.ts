import type { TalentTreeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Flat: plain stats, always open. */
export const body: TalentTreeDef = {
  id: 'body',
  name: 'Body',
  description: 'Faster, tougher, stronger, gems from further away.',
  look: { shape: 'circle', color: PALETTE.lime },
  talents: [
    { id: 'swift', upgrade: 'swift', max: 5 },
    { id: 'vigor', upgrade: 'vigor', max: 3 },
    { id: 'might', upgrade: 'might', max: 5 },
    { id: 'magnet', upgrade: 'magnet', max: 3 },
  ],
};
