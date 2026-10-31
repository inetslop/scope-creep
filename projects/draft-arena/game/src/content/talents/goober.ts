import type { TalentTreeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The hunt playstyle: walk into the crowd and your Goo finds the nearest thing for you. */
export const goober: TalentTreeDef = {
  id: 'goober',
  name: 'Goober',
  description: 'Your Goo: a drop that turns and finds the nearest enemy for you.',
  look: { shape: 'circle', color: PALETTE.blue },
  talents: [
    { id: 'reap', upgrade: 'reap', max: 3 },
    { id: 'goo', upgrade: 'goo', max: 3, needs: [['reap', 1]] },
    { id: 'gush', upgrade: 'gush', max: 3, needs: [['goo', 1]] },
    { id: 'chew', upgrade: 'chew', max: 3, needs: [['gush', 3]] },
    { id: 'cling', upgrade: 'cling', max: 3, needs: [['goo', 2]] },
    { id: 'scatter', upgrade: 'scatter', max: 1, needs: [['goo', 3]] },
  ],
};
