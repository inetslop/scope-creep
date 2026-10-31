import type { ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A small pale ice dart: flies straight (no path, no step), gone on hit or after 0.5 s. */
export const jab: ProjectileDef = {
  id: 'jab',
  radius: 5,
  life: 0.5,
  look: { shape: 'triangle', color: PALETTE.ice },
};
