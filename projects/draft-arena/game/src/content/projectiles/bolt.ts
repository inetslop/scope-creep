import type { ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A spinning star that flies straight (no path, no step: the default). */
export const bolt: ProjectileDef = {
  id: 'bolt',
  radius: 6,
  life: 1.1,
  look: { shape: 'star', color: PALETTE.yellow },
};
