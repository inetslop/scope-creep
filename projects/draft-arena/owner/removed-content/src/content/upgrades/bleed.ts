import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const bleed: UpgradeDef = {
  id: 'bleed',
  name: 'Bleed',
  description: 'Hits make enemies bleed: 3 damage a second per stack, up to 5 stacks. Each rank adds a stack per hit.',
  maxLevel: 3,
  look: { shape: 'diamond', color: PALETTE.red },
  onHit(ctx, me, level, hit) {
    // Who made it bleed, so the bleed's kills are theirs (statuses don't know on their own).
    hit.target.mem.bleedBy = me.id;
    ctx.addStatus(hit.target, 'bleed', 2.5, level);
  },
};
