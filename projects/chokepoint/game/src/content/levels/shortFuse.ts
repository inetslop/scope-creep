import type { LevelAugmentDef } from '../types';

/** Short fuse: while it is on, the build countdown runs 70% of its normal length, rounded to the nearest second. */
export const shortFuse: LevelAugmentDef = {
  id: 'short-fuse',
  name: 'Short fuse',
  line: 'the build countdown runs 30% shorter',
  bonus: 0.30,
};
