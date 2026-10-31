import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Hive mod, works with every weapon: the crowd around a target makes each hit on it land harder. */
export const swarm: UpgradeDef = {
  id: 'swarm',
  name: 'Swarm',
  description: 'Your hits deal +2 damage per other enemy within 80 of the target (up to 3). Per rank: +1 more per neighbor.',
  maxLevel: 3,
  look: { shape: 'hexagon', color: PALETTE.purple },
  onHit(ctx, me, level, hit) {
    if (hit.damage <= 0) return; // 0-damage touches (the goo bubble in flight) are not hits
    const per = level + 1; // rank 1: +2, rank 2: +3, rank 3: +4 per neighbor
    let neighbors = 0;
    for (const u of ctx.unitsNear(hit.target.x, hit.target.y, 80))
      if (u.alive && u !== hit.target) neighbors++;
    const bonus = per * Math.min(neighbors, 3);
    if (bonus > 0) ctx.damage(hit.target, bonus, me);
  },
};
