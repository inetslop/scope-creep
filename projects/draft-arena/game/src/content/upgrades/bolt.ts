import { v, type UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The nomad's weapon (everyone starts with a rank of it, in Gunner): bolts at the nearest enemy. */
export const bolt: UpgradeDef = {
  id: 'bolt',
  name: 'Bolt',
  description: 'Fires a bolt at the nearest enemy. Each rank: +4 damage; every second rank, one more bolt.',
  maxLevel: 6,
  look: { shape: 'circle', color: PALETTE.yellow },
  cooldown: 0.75,
  fire(ctx, me, level) {
    const target = ctx.nearestEnemy(me, 520);
    if (!target) return;
    const count = 1 + Math.floor((level - 1) / 2);
    const aim = v.angleTo(me, target);
    for (let i = 0; i < count; i++) {
      ctx.fire(me, 'bolt', { angle: aim + (i - (count - 1) / 2) * 0.18, speed: 560, damage: 8 + 4 * (level - 1) });
    }
  },
};
