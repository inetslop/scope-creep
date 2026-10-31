import type { TalentTreeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Short and steep: the nomad's Bolt grows fast, and the capstone comes early. */
export const gunner: TalentTreeDef = {
  id: 'gunner',
  name: 'Gunner',
  description: 'Your Bolt, faster and in volleys.',
  look: { shape: 'star', color: PALETTE.yellow },
  talents: [
    { id: 'haste', upgrade: 'haste', max: 3 },
    { id: 'bolt', upgrade: 'bolt', max: 5, start: 1, needs: [['haste', 1]] },
    { id: 'split', upgrade: 'split', max: 2, needs: [['bolt', 2]] },
    { id: 'ricochet', upgrade: 'ricochet', max: 1, needs: [['bolt', 4]] },
  ],
};
