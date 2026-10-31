import type { PickupDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Feast gem: an event gem in green that lasts 20 s, laid where a player prestiges. */
export const feastGem: PickupDef = {
  id: 'feast-gem',
  radius: 7,
  life: 20,
  look: { shape: 'star', color: PALETTE.green },
  collect(ctx, p, value) {
    ctx.giveXp(p, value);
    if (!p.bot) {
      ctx.giveCoins(p, 1);
      ctx.effect('coin', { x: p.x, y: p.y }, undefined, 1);
    }
  },
};
