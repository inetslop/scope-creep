import { v, type UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const goo: UpgradeDef = {
  id: 'goo',
  name: 'Goo',
  description:
    'Every 1.6 s, lobs a big blue drop at the nearest enemy within 260; it turns in flight to catch it, or plops straight with none in range. 18 damage, 110 u/s, 2.5 s. Each rank: +6 damage.',
  maxLevel: 3,
  look: { shape: 'circle', color: PALETTE.blue },
  cooldown: 1.6,
  fire(ctx, me, level) {
    const target = ctx.nearestEnemy(me, 260);
    const aim = target ? v.angleTo(me, target) : me.input.aim;
    ctx.fire(me, 'goo', { angle: aim, speed: 110, damage: 18 + 6 * (level - 1) });
  },
};
