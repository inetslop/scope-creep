import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** On-hit: projectile hits jump to more enemies. */
export const chain: UpgradeDef = {
  id: 'chain',
  name: 'Chain',
  description: 'Shots that hit jump to 1 more enemy nearby for half damage. Each rank: one more jump.',
  maxLevel: 4,
  look: { shape: 'star', color: PALETTE.ice },
  onHit(ctx, me, level, hit) {
    if (!hit.projectile) return;
    const others = ctx.enemiesNear(me, hit.x, hit.y, 160).filter((u) => u !== hit.target);
    for (const other of others.slice(0, level)) {
      ctx.damage(other, hit.damage * 0.5, me);
      ctx.effect('zap', hit, other);
    }
  },
};
