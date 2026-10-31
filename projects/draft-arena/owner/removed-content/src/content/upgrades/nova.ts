import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

const RADIUS = 170;

/** Aura capstone: a burst that hits hard and shoves monsters away. */
export const nova: UpgradeDef = {
  id: 'nova',
  name: 'Nova',
  description: 'Every 6 s, a burst around you deals 30 damage and knocks monsters back.',
  maxLevel: 1,
  look: { shape: 'circle', color: PALETTE.teal, scale: 1.1 },
  cooldown: 6,
  fire(ctx, me) {
    for (const e of ctx.enemiesNear(me, me.x, me.y, RADIUS * me.stats.area)) {
      ctx.damage(e, 30 * me.stats.damage, me);
      if (e.type !== 'monster') continue;
      const d = Math.hypot(e.x - me.x, e.y - me.y) || 1;
      e.x += ((e.x - me.x) / d) * 90;
      e.y += ((e.y - me.y) / d) * 90;
    }
    ctx.effect('nova', me, me, RADIUS * me.stats.area);
  },
};
