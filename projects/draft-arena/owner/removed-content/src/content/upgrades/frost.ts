import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const frost: UpgradeDef = {
  id: 'frost',
  name: 'Frost',
  description: 'Your hits chill: 40% slower for 1.5 s. Each rank: +0.5 s.',
  maxLevel: 3,
  look: { shape: 'diamond', color: PALETTE.ice },
  onHit(ctx, _me, level, hit) {
    ctx.addStatus(hit.target, 'chill', 1 + 0.5 * level);
  },
};
