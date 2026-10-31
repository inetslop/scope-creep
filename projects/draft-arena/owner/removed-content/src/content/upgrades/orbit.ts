import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const orbitBlades: UpgradeDef = {
  id: 'orbit',
  name: 'Orbit',
  description: 'Every 4 s, blades circle you for 3 s, hitting everything they touch. Each rank: one more blade.',
  maxLevel: 5,
  look: { shape: 'square', color: PALETTE.teal },
  cooldown: 4,
  fire(ctx, me, level) {
    const blades = level + 1;
    for (let i = 0; i < blades; i++) {
      ctx.fire(me, 'orbit', { angle: (i / blades) * Math.PI * 2, speed: 0, damage: 7 + 2 * level, life: 3, p1: 300, p2: 72 });
    }
  },
};
