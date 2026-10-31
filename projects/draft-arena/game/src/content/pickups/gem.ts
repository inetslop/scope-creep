import type { PickupDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Dropped by every monster (rules.gem), worth its xp. */
export const gem: PickupDef = {
  id: 'gem',
  radius: 7,
  life: 30,
  look: { shape: 'diamond', color: PALETTE.green },
  collect(ctx, p, value) {
    ctx.giveXp(p, value);
  },
};
