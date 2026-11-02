import type { LevelAugmentDef } from '../types';

/** Blind: while it is on, the build phase never previews the next wave: no preview card, no flyer line. */
export const blind: LevelAugmentDef = {
  id: 'blind',
  name: 'Blind',
  line: 'no preview of the next wave',
  bonus: 0.35,
};
