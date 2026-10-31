import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A mean close-range ring: needles burst from the player in every direction, biting harder the more hurt you are. */
export const nerve: UpgradeDef = {
  id: 'nerve',
  name: 'Nerve',
  description:
    'Every 0.6 s, when an enemy is near, a ring of needles bursts from you, stabbing whatever is close: 4 at rank 1, 6 at rank 2, 8 at rank 3. Each needle: 5 damage, +2 per rank, +1 per 10 hp missing.',
  maxLevel: 3,
  look: { shape: 'diamond', color: PALETTE.red },
  cooldown: 0.6,
  fire(ctx, me, level) {
    if (!ctx.nearestEnemy(me, 200)) return;
    const missing = me.maxHp - me.hp;
    const needles = 2 + 2 * level; // rank 1: 4, rank 2: 6, rank 3: 8
    const damage = 5 + 2 * (level - 1) + Math.floor(missing / 10);
    const turn = me.angle + ctx.rng.next() * Math.PI * 2;
    for (let i = 0; i < needles; i++) {
      ctx.fire(me, 'jab', { angle: turn + (i * Math.PI * 2) / needles, speed: 520, damage, life: 0.33 / me.stats.projectileSpeed });
    }
  },
};
