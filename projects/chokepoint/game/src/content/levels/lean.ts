import type { LevelAugmentDef } from '../types';

/** Lean: while it is on, every kill's own gold is 75% of the enemy's bounty, floored down, minimum 1 gold. */
export const lean: LevelAugmentDef = {
  id: 'lean',
  name: 'Lean',
  line: 'kills pay 25% less gold',
  bonus: 0.25,
};
