import type { TalentTreeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A ladder: Frost, then Chain, then Spark; the capstone needs Frost maxed and some Spark. */
export const storm: TalentTreeDef = {
  id: 'storm',
  name: 'Storm',
  description: 'Chill them, chain them, shatter them.',
  look: { shape: 'diamond', color: PALETTE.ice },
  talents: [
    { id: 'frost', upgrade: 'frost', max: 3 },
    { id: 'chain', upgrade: 'chain', max: 3, needs: [['frost', 1]] },
    { id: 'spark', upgrade: 'spark', max: 5, needs: [['chain', 1]] },
    { id: 'shatter', upgrade: 'shatter', max: 1, needs: [['frost', 3], ['spark', 2]] },
  ],
};
