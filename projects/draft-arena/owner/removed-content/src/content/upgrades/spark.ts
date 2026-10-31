import { v, type UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Storm's weapon: a near-instant spark at the nearest enemy. Fast enough to feel like lightning, still a shot. */
export const spark: UpgradeDef = {
  id: 'spark',
  name: 'Spark',
  description: 'Every 1.1 s, a spark of lightning strikes the nearest enemy. Each rank: +4 damage.',
  maxLevel: 5,
  look: { shape: 'star', color: PALETTE.ice },
  cooldown: 1.1,
  fire(ctx, me, level) {
    const target = ctx.nearestEnemy(me, 480);
    if (!target) return;
    ctx.fire(me, 'spark', { angle: v.angleTo(me, target), speed: 1100, damage: 9 + 4 * (level - 1) });
  },
};
