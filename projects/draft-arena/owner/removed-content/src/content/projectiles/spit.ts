import type { ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The Spitter's slow shot (monsters fire with ctx.fire like players do). */
export const spit: ProjectileDef = {
  id: 'spit',
  radius: 8,
  life: 2.2,
  look: { shape: 'circle', color: PALETTE.pink },
};
