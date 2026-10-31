import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Wave capstone: a giant wave every few seconds. */
export const tide: UpgradeDef = {
  id: 'tide',
  name: 'Tide',
  description: 'Every 5 s, a giant wave rolls out that passes through everything.',
  maxLevel: 1,
  look: { shape: 'hexagon', color: PALETTE.teal, scale: 1.1 },
  cooldown: 5,
  fire(ctx, me) {
    const target = ctx.nearestEnemy(me, 700);
    const angle = target ? Math.atan2(target.y - me.y, target.x - me.x) : me.input.aim;
    ctx.fire(me, 'tide', { angle, speed: 300, damage: 30, p1: ctx.rng.int(7) });
  },
};
