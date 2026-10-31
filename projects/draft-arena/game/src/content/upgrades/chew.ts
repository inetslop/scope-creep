import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A Goo kill by a Chewer: the Gush puddle it lays bites whatever stands in it. */
export const chew: UpgradeDef = {
  id: 'chew',
  name: 'Chew',
  description: 'Whatever stands in your Gush puddle takes 6 damage every 0.5 s. Per rank: +6 damage.',
  maxLevel: 3,
  look: { shape: 'diamond', color: PALETTE.teal },
  onKill(ctx, me, level, victim) {
    if (ctx.time - (victim.mem.gooAt ?? -99) > 0.4) return; // only kills a Goo just struck
    ctx.area(me, 'chew-puddle', { x: victim.x, y: victim.y, damage: 6 * level });
  },
};
