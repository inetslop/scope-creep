import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const splash: UpgradeDef = {
  id: 'splash',
  name: 'Splash',
  description: 'Hits also deal 20% of their damage to enemies around them. Per rank.',
  maxLevel: 3,
  look: { shape: 'circle', color: PALETTE.teal },
  onHit(ctx, me, level, hit) {
    if (hit.damage <= 0) return;
    for (const e of ctx.enemiesNear(me, hit.x, hit.y, 70)) {
      if (e !== hit.target) ctx.damage(e, hit.damage * 0.2 * level, me);
    }
  },
};
