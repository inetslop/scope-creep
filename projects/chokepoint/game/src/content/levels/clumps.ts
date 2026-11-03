import type { LevelAugmentDef } from '../types';

/**
 * Clumps: while it is on, the run plays in one rhythm — every non-quiet, non-boss wave walks in
 * clumps of 2 and 3, the 4 s simulation-time gap between them (core/waves.ts) — and the wave's
 * own number-based march tags do not fire (no tight, rush, short cut, double, screen or scatter
 * wave): the march is the level's, one rhythm for the whole run. The level chip under the stats
 * card says the march; nothing is shown twice.
 */
export const clumps: LevelAugmentDef = {
  id: 'clumps',
  name: 'Clumps',
  line: 'every wave comes in clumps',
  bonus: 0.4,
};
