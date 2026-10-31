import { v, type UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Goober fork: the Goo's long arm — a thin ice needle at the farthest enemy within 400. */
export const reach: UpgradeDef = {
  id: 'reach',
  name: 'Reach',
  description:
    'Every 4.0 s, a thin ice needle at the farthest enemy within 400. 24 damage. Rank 2: two needles at the two farthest, 20 each.',
  maxLevel: 2,
  look: { shape: 'triangle', color: PALETTE.ice },
  cooldown: 4,
  fire(ctx, me, level) {
    const foes = ctx.enemiesNear(me, me.x, me.y, 400)
      .map((u) => ({ u, d: (u.x - me.x) ** 2 + (u.y - me.y) ** 2 }))
      .sort((a, b) => b.d - a.d); // farthest first, the opposite of every other weapon
    const n = Math.min(level, foes.length); // rank 1: one needle, rank 2: two (or fewer)
    for (let i = 0; i < n; i++) {
      const t = foes[i]!.u;
      ctx.fire(me, 'needle', { angle: v.angleTo(me, t), speed: 500, damage: level === 1 ? 24 : 20 });
    }
  },
};
