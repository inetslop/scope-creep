import type { ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Frenzy's needle: a small red shard that flies straight and fast (no path, no step), gone on hit or after 0.33 s. */
export const jab: ProjectileDef = {
  id: 'jab',
  radius: 5,
  life: 0.33,
  look: { shape: 'diamond', color: PALETTE.red, scale: 1.2 },
};
