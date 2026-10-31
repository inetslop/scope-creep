import { v, type UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The Body's weapon: a bite zone in front of the player (area 'bite'). */
export const maw: UpgradeDef = {
  id: 'maw',
  name: 'Maw',
  description: 'Every 0.9 s, if an enemy is close, bites everything in front. Each rank: +6 bite damage.',
  maxLevel: 5,
  look: { shape: 'hexagon', color: PALETTE.ice },
  cooldown: 0.9,
  fire(ctx, me, level) {
    const target = ctx.nearestEnemy(me, 130);
    if (!target) return;
    const p = v.fromAngle(v.angleTo(me, target), 55);
    ctx.area(me, 'bite', { x: me.x + p.x, y: me.y + p.y, damage: 25 + 6 * (level - 1) });
  },
};
