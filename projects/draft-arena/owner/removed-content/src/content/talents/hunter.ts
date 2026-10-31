import type { TalentTreeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A chain: Pierce opens Seeker, and the capstone needs Seeker deep plus a point of Reach. */
export const hunter: TalentTreeDef = {
  id: 'hunter',
  name: 'Hunter',
  description: 'Shots that pierce, fly far and find their own way.',
  look: { shape: 'triangle', color: PALETTE.blue },
  talents: [
    { id: 'pierce', upgrade: 'pierce', max: 3 },
    { id: 'seeker', upgrade: 'seeker', max: 4, needs: [['pierce', 2]] },
    { id: 'swarm', upgrade: 'swarm', max: 1, needs: [['seeker', 3], ['reach', 1]] },
    { id: 'reach', upgrade: 'reach', max: 3 },
  ],
};
