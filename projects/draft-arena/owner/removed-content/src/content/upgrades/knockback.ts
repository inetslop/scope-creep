import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const knockback: UpgradeDef = {
  id: 'knockback',
  name: 'Knockback',
  description: 'Hits shove monsters back 14 units. Per rank.',
  maxLevel: 3,
  look: { shape: 'square', color: PALETTE.teal },
  onHit(_ctx, me, level, hit) {
    if (hit.target.type !== 'monster') return;
    // Along the shot's flight, or away from you for hits without one (areas).
    const a = hit.projectile ? hit.projectile.angle : Math.atan2(hit.target.y - me.y, hit.target.x - me.x);
    hit.target.x += Math.cos(a) * 14 * level;
    hit.target.y += Math.sin(a) * 14 * level;
  },
};
