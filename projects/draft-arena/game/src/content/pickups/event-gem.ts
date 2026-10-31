import type { PickupDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Dropped by field events (gem rain, gem geyser), worth its xp and 1 coin for a human player. */
export const eventGem: PickupDef = {
  id: 'event-gem',
  radius: 7,
  life: 30,
  look: { shape: 'star', color: PALETTE.yellow },
  collect(ctx, p, value) {
    ctx.giveXp(p, value);
    if (!p.bot) {
      ctx.giveCoins(p, 1);
      ctx.effect('coin', { x: p.x, y: p.y }, undefined, 1);
    }
  },
};
