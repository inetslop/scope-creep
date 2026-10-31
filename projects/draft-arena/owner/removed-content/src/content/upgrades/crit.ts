import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const crit: UpgradeDef = {
  id: 'crit',
  name: 'Crit',
  description: 'Hits have a 10% chance to deal double damage. Per rank.',
  maxLevel: 3,
  look: { shape: 'star', color: PALETTE.red },
  onHit(ctx, me, level, hit) {
    if (hit.damage > 0 && ctx.rng.chance(0.1 * level)) ctx.damage(hit.target, hit.damage, me);
  },
};
