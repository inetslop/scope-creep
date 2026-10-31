import { v, type UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A Lash split: a horn dart that hits sends small darts at the critters standing beside it. */
export const lash: UpgradeDef = {
  id: 'lash',
  name: 'Lash',
  description:
    'After 1 prestige this life. Your horn darts split on hit: each hit sends 2 small darts (3 damage, 0.4 s) at the 2 nearest other enemies within 100. Rank 2: 3 small darts.',
  maxLevel: 2,
  look: { shape: 'hexagon', color: PALETTE.purple },
  onHit(ctx, me, level, hit) {
    if (!hit.projectile || hit.projectile.def.id !== 'horn') return; // horn darts only
    const others = ctx.enemiesNear(me, hit.x, hit.y, 100).filter((u) => u !== hit.target);
    if (others.length === 0) return;
    others.sort((a, b) => (a.x - hit.x) ** 2 + (a.y - hit.y) ** 2 - ((b.x - hit.x) ** 2 + (b.y - hit.y) ** 2));
    const n = Math.min(1 + level, others.length); // rank 1: 2 darts, rank 2: 3
    ctx.effect('lash-tick', { x: hit.x, y: hit.y });
    for (let i = 0; i < n; i++) {
      const t = others[i]!;
      ctx.fire(me, 'lash-dart', { x: hit.x, y: hit.y, angle: v.angleTo({ x: hit.x, y: hit.y }, t), speed: 400, damage: 3 });
    }
  },
};
