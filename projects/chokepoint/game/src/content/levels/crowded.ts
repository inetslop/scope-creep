import type { LevelAugmentDef } from '../types';

/** Crowded: while it is on, every wave's plan sends 20% more enemies (a boss wave keeps its own plan). */
export const crowded: LevelAugmentDef = {
  id: 'crowded',
  name: 'Crowded',
  line: 'waves send 20% more enemies',
  bonus: 0.2,
  countMul: 1.2,
};
