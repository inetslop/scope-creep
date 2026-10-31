import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const auraField: UpgradeDef = {
  id: 'aura',
  name: 'Aura',
  description: 'A field around you hits everything in it twice a second. Each rank: +4 damage and wider.',
  maxLevel: 5,
  look: { shape: 'circle', color: PALETTE.teal },
  cooldown: 2,
  fire(ctx, me, level) {
    // Lives exactly until the next one, whatever the cooldown stat makes that.
    ctx.area(me, 'aura', { follow: true, life: 2 * me.stats.cooldown, damage: 5 + 4 * (level - 1), radius: 85 + 12 * (level - 1) });
  },
};
