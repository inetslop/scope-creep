import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Control capstone: chilled enemies take double damage. */
export const shatter: UpgradeDef = {
  id: 'shatter',
  name: 'Shatter',
  description: 'Chilled enemies take double damage from your hits.',
  maxLevel: 1,
  look: { shape: 'diamond', color: PALETTE.ice, scale: 1.1 },
  onHit(ctx, me, _level, hit) {
    if (hit.damage > 0 && ctx.statusOf(hit.target, 'chill') > 0) ctx.damage(hit.target, hit.damage, me);
  },
};
