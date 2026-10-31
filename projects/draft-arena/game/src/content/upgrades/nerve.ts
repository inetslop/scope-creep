import { v, type UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A close jab: it only fires within 180, and bites harder the more hurt you are. */
export const nerve: UpgradeDef = {
  id: 'nerve',
  name: 'Nerve',
  description: 'Every 0.8 s, a jab at the nearest enemy within 180. Hits harder the more hurt you are: +1 damage per 10 hp missing. Each rank: +2 damage.',
  maxLevel: 3,
  look: { shape: 'diamond', color: PALETTE.ice },
  cooldown: 0.8,
  fire(ctx, me, level) {
    const target = ctx.nearestEnemy(me, 180);
    if (!target) return;
    const missing = me.maxHp - me.hp;
    ctx.fire(me, 'jab', { angle: v.angleTo(me, target), speed: 360, damage: 5 + 2 * (level - 1) + Math.floor(missing / 10) });
  },
};
