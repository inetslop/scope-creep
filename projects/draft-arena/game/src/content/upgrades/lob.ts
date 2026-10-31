import { v, type UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';
import { BUBBLE_FLIGHT, BUBBLE_SPEED } from '../projectiles/bubble.ts';

/** The Lobber's weapon: an arcing bubble that splashes where it lands. */
export const lob: UpgradeDef = {
  id: 'lob',
  name: 'Lob',
  description: 'Every 1.1 s, throws a bubble at the nearest enemy. It splashes where it lands. Each rank: +2 splash damage.',
  maxLevel: 5,
  look: { shape: 'circle', color: PALETTE.teal },
  cooldown: 1.1,
  fire(ctx, me, level) {
    const target = ctx.nearestEnemy(me, 420);
    if (!target) return;
    // Aims at where the enemy is now, with no lead: the bubble lands where it was.
    // life shortens with the projectileSpeed stat, so Quick lands the splash sooner.
    ctx.fire(me, 'bubble', {
      angle: v.angleTo(me, target),
      speed: BUBBLE_SPEED,
      damage: 0,
      life: BUBBLE_FLIGHT / me.stats.projectileSpeed,
      p1: Math.round(target.x),
      p2: Math.round(target.y) * 8 + (level - 1),
    });
  },
};
