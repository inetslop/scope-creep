import { v, type UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Hive weapon: a fast close-range dart at the nearest enemy, to stand in the crowd where Swarm pays. */
export const horn: UpgradeDef = {
  id: 'horn',
  name: 'Horn',
  description: 'Every 0.8 s, a fast dart at the nearest enemy within 240. 9 damage. Per rank: +3 damage.',
  maxLevel: 3,
  look: { shape: 'triangle', color: PALETTE.teal },
  cooldown: 0.8,
  fire(ctx, me, level) {
    const target = ctx.nearestEnemy(me, 240);
    if (!target) return;
    const aim = v.angleTo(me, target);
    ctx.fire(me, 'horn', { angle: aim, speed: 400, damage: 9 + 3 * (level - 1) });
  },
};
