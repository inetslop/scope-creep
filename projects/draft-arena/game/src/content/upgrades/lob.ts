import { v, type UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';
import { BUBBLE_FLIGHT, BUBBLE_SPEED } from '../projectiles/bubble.ts';
import { ECHO_RETURN, ECHO_TURN } from '../projectiles/echo-bubble.ts';
import { bopRank } from './bop.ts';
import { echoRank } from './echo.ts';

/** Bop's pop damage, the same numbers bop-bubble.ts pops for: 14 at rank 1, +5 per rank. */
const BOP_POP = (rank: number): number => 14 + 5 * (rank - 1);

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
    // Echo rewrites the flight: the same arc out and splash, then the bubble turns and comes back.
    if (echoRank(me) > 0) {
      const bop = bopRank(me); // with Bop the bubble pops on the critter it touches and never returns
      ctx.fire(me, 'echo-bubble', {
        angle: v.angleTo(me, target),
        speed: BUBBLE_SPEED,
        damage: bop ? BOP_POP(bop) : 0,
        pierce: bop ? 1 : 99,
        life: BUBBLE_FLIGHT / me.stats.projectileSpeed + ECHO_TURN + ECHO_RETURN / me.stats.projectileSpeed,
        p1: Math.round(target.x),
        p2: Math.round(target.y) * 8 + (level - 1),
      });
      return;
    }
    // Aims at where the enemy is now, with no lead: the bubble lands where it was.
    // life shortens with the projectileSpeed stat, so Quick lands the splash sooner.
    ctx.fire(me, bopRank(me) > 0 ? 'bop-bubble' : 'bubble', {
      angle: v.angleTo(me, target),
      speed: BUBBLE_SPEED,
      damage: 0,
      life: BUBBLE_FLIGHT / me.stats.projectileSpeed,
      p1: Math.round(target.x),
      p2: Math.round(target.y) * 8 + (level - 1),
    });
  },
};
