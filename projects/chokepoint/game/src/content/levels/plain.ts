import type { LevelAugmentDef } from '../types';

/**
 * Plain: while it is on, the board grows with no marked cell (neither the first mark nor the
 * double mark's second cell) and no guaranteed choke cell — the board's face is plain and the
 * cover is the player's to find; the road, the cells, the rocks and the shape modifiers stand.
 */
export const plain: LevelAugmentDef = {
  id: 'plain',
  name: 'Plain',
  line: 'no marked cell, no guaranteed choke',
  bonus: 0.4,
};
