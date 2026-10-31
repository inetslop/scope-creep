import type { ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A small purple hex dart: straight flight, gone on hit or after 0.5 s. One per enemy, from the Horn. */
export const horn: ProjectileDef = {
  id: 'horn',
  radius: 6,
  life: 0.5,
  look: { shape: 'hexagon', color: PALETTE.purple },
};
