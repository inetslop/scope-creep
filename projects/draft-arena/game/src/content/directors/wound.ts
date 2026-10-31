import type { DirectorDef } from '../../../engine/api.ts';

/**
 * The wound: a red collar arc (areas/wound.ts) around every critter - player and monster alike
 * - whose hp is at or below half of its max hp. The area is short-lived (0.15 s) and re-fired
 * every tick, so the collar tracks the hp live and disappears within a few ticks of healing.
 */
export const wound: DirectorDef = {
  id: 'wound',
  name: 'The wound',
  description: 'A red collar shows on any critter under half hp.',
  tick(ctx) {
    // The whole 4000 x 4000 field from its centre: one call reaches every critter.
    for (const u of ctx.unitsNear(2000, 2000, 4000)) {
      if (u.hp * 2 <= u.maxHp) ctx.area(u, 'wound');
    }
  },
};
