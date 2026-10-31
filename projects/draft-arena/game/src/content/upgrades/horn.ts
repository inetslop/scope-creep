import { v, type UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Hive weapon: the crowd is the target - a dart at every enemy around you, nearest first, up to a cap. */
export const horn: UpgradeDef = {
  id: 'horn',
  name: 'Horn',
  description:
    'Every 0.8 s, a purple hex dart at every enemy within 150 (nearest first, up to 4). 7 damage each. Per rank: +2 damage, +25 range, +1 more dart.',
  maxLevel: 3,
  look: { shape: 'hexagon', color: PALETTE.purple },
  cooldown: 0.8,
  fire(ctx, me, level) {
    const targets = ctx.enemiesNear(me, me.x, me.y, 150 + 25 * (level - 1)).sort(
      (a, b) => (a.x - me.x) ** 2 + (a.y - me.y) ** 2 - ((b.x - me.x) ** 2 + (b.y - me.y) ** 2),
    );
    for (let i = 0; i < Math.min(4 + (level - 1), targets.length); i++) {
      const t = targets[i]!;
      ctx.fire(me, 'horn', { angle: v.angleTo(me, t), speed: 460, damage: 7 + 2 * (level - 1), life: 0.5 / me.stats.projectileSpeed });
    }
  },
};
