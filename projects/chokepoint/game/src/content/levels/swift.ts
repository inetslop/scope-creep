import type { LevelAugmentDef } from '../types';

/** Swift: while it is on, every enemy that spawns walks 15% faster, wave 1 to the last. */
export const swift: LevelAugmentDef = {
  id: 'swift',
  name: 'Swift',
  line: 'enemies walk 15% faster',
  bonus: 0.15,
  speedMul: 1.15,
};
