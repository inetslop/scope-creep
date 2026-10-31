import type { PickupDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The prestige pay: dropped at the player's feet, collected at once, the coins land in their profile. */
export const coin: PickupDef = {
  id: 'coin',
  radius: 7,
  life: 2,
  look: { shape: 'circle', color: PALETTE.yellow },
  collect(ctx, p, value) {
    ctx.giveCoins(p, value);
  },
};
