import type { TalentTreeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Two paths that meet: Wave needs a point in both Knockback and Splash. */
export const tideTree: TalentTreeDef = {
  id: 'tide',
  name: 'Tide',
  description: 'Waves that shove and splash through crowds.',
  look: { shape: 'hexagon', color: PALETTE.teal },
  talents: [
    { id: 'knockback', upgrade: 'knockback', max: 3 },
    { id: 'wave', upgrade: 'wave', max: 5, needs: [['knockback', 1], ['splash', 1]] },
    { id: 'tide', upgrade: 'tide', max: 1, needs: [['wave', 3]] },
    { id: 'splash', upgrade: 'splash', max: 3 },
  ],
};
