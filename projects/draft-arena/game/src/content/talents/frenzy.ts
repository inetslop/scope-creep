import type { TalentTreeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Thin and mean: its jab, its capstone and its kill reward all pay out while hurt. */
export const frenzy: TalentTreeDef = {
  id: 'frenzy',
  name: 'Frenzy',
  description: 'Thin and mean: the more hurt you are, the harder you hit.',
  look: { shape: 'diamond', color: PALETTE.red },
  talents: [
    { id: 'frenzy', upgrade: 'frenzy', max: 3 },
    { id: 'nerve', upgrade: 'nerve', max: 3, needs: [['frenzy', 1]] },
    { id: 'adrenaline', upgrade: 'adrenaline', max: 2, needs: [['nerve', 2]] },
    { id: 'fang', upgrade: 'fang', max: 2, needs: [['nerve', 2]] },
    { id: 'reckless', upgrade: 'reckless', max: 1, needs: [['nerve', 3], ['frenzy', 3]] },
  ],
};
