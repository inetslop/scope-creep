import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const seekers: UpgradeDef = {
  id: 'seeker',
  name: 'Seeker',
  description: 'Every 2 s, a homing shot that finds its own target. Each rank: one more shot.',
  maxLevel: 4,
  look: { shape: 'triangle', color: PALETTE.blue },
  cooldown: 2,
  fire(ctx, me, level) {
    for (let i = 0; i < level; i++) {
      ctx.fire(me, 'seeker', { angle: me.input.aim + (i - (level - 1) / 2) * 0.6, speed: 330, damage: 9 });
    }
  },
};
