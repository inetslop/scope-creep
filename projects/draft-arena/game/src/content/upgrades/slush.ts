import { v, type UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/**
 * Slush: a straight-flying slush blob where it was aimed; where it lands it leaves the
 * slush-puddle area, striking and slowing everything standing in it for 2.5 s plus 0.5 s per
 * rank. Rank 1 strikes for 4, rank 2 for 6, rank 3 for 8.
 */
export const slush: UpgradeDef = {
  id: 'slush',
  name: 'Slush',
  description:
    'Every 1.6 s, if an enemy is within 240, throws a slush blob straight toward it; it flies past enemies and, where it lands, leaves a 40-unit puddle for 2.5 s (+0.5 s per rank) that strikes and slows whatever stands in it for 2.5 s. Rank 1: 4 damage, rank 2: 6, rank 3: 8.',
  maxLevel: 3,
  look: { shape: 'circle', color: PALETTE.ice },
  cooldown: 1.6,
  fire(ctx, me, level) {
    const target = ctx.nearestEnemy(me, 240);
    if (!target) return;
    ctx.fire(me, 'slush-blob', {
      angle: v.angleTo(me, target),
      speed: 200,
      damage: 0,
      life: 1.2 / me.stats.projectileSpeed,
      p1: level - 1,
      p2: 0,
    });
  },
};
