import type { ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Sawstorm's saws: spinning stars flying straight out. */
export const saw: ProjectileDef = {
  id: 'saw',
  radius: 9,
  life: 0.9,
  pierce: 4,
  look: { shape: 'star', color: PALETTE.teal },
};
