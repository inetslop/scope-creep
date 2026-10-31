import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Goober mod, works with every weapon: finish what you wounded before the next volley. */
export const reap: UpgradeDef = {
  id: 'reap',
  name: 'Reap',
  description: 'Hits on an enemy below half its hp deal +6 damage, per rank.',
  maxLevel: 3,
  look: { shape: 'diamond', color: PALETTE.blue },
  onHit(ctx, me, level, hit) {
    if (hit.damage <= 0) return; // the bubble's 0-damage in-flight touch is not a hit
    const before = hit.target.hp + hit.damage; // hp before this strike
    if (before < hit.target.maxHp * 0.5) ctx.damage(hit.target, 6 * level, me);
  },
};
