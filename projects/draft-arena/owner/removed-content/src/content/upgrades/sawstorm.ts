import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Orbit capstone: saws burst outward around you. */
export const sawstorm: UpgradeDef = {
  id: 'sawstorm',
  name: 'Sawstorm',
  description: 'Every 3 s, six saws burst outward from you, each cutting through 4 enemies.',
  maxLevel: 1,
  look: { shape: 'star', color: PALETTE.teal, scale: 1.1 },
  cooldown: 3,
  fire(ctx, me) {
    const turn = ctx.rng.next() * Math.PI;
    for (let i = 0; i < 6; i++) ctx.fire(me, 'saw', { angle: turn + (i / 6) * Math.PI * 2, speed: 420, damage: 11 });
  },
};
