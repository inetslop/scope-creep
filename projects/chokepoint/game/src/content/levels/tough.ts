import type { LevelAugmentDef } from '../types';

/** Tough: while it is on, every enemy has 25% more health than the wave's own growth gives, wave 1 to the last. */
export const tough: LevelAugmentDef = {
  id: 'tough',
  name: 'Tough',
  line: 'enemies +25% health',
  bonus: 0.25,
};
