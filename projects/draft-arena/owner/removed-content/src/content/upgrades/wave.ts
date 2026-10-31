import { v, type UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const waveShot: UpgradeDef = {
  id: 'wave',
  name: 'Wave',
  description: 'Every 1.4 s, a weaving shot that passes through 3 enemies. Each rank: +5 damage.',
  maxLevel: 5,
  look: { shape: 'hexagon', color: PALETTE.teal },
  cooldown: 1.4,
  fire(ctx, me, level) {
    const target = ctx.nearestEnemy(me, 600);
    const angle = target ? v.angleTo(me, target) : me.input.aim;
    ctx.fire(me, 'wave', { angle, speed: 380, damage: 12 + 5 * (level - 1), pierce: 3, p1: ctx.rng.int(7) });
  },
};
