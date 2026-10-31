import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Body mod: every hit slows the target (rank 1: 30% for 1 s; +10% and +0.5 s per rank). */
export const chill: UpgradeDef = {
  id: 'chill',
  name: 'Chill',
  description: 'Hits slow the target by 30% for 1 s. Per rank: +10% slower, +0.5 s.',
  maxLevel: 3,
  look: { shape: 'hexagon', color: PALETTE.ice },
  onHit(ctx, _me, level, hit) {
    // One status per rank (speedMul is fixed per def): re-adds refresh, never stack.
    const fresh = [1, 2, 3].every((n) => !ctx.statusOf(hit.target, `chill-${n}`));
    ctx.addStatus(hit.target, `chill-${level}`, 0.5 + level * 0.5);
    if (fresh) ctx.effect('slow-pop', { x: hit.x, y: hit.y });
  },
};
