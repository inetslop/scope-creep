import type { TalentTreeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The area playstyle: hold a spot or lure a crowd, and one bubble clears it. */
export const lobber: TalentTreeDef = {
  id: 'lobber',
  name: 'Lobber',
  description: 'Your bubble: it arcs in and splashes on the ground.',
  look: { shape: 'circle', color: PALETTE.teal },
  talents: [
    { id: 'quick', upgrade: 'quick', max: 3 },
    { id: 'lob', upgrade: 'lob', max: 5, needs: [['quick', 1]] },
    { id: 'wide', upgrade: 'wide', max: 3, needs: [['lob', 2]] },
    { id: 'fuse', upgrade: 'fuse', max: 1, needs: [['lob', 4]] },
    { id: 'slush', upgrade: 'slush', max: 3, needs: [['lob', 1]], points: 2, prestige: 1 },
  ],
};
