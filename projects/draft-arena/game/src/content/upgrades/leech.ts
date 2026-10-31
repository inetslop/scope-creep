import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Hive mod, works with every weapon: while the crowd is on you, every hit you land heals you. */
export const leech: UpgradeDef = {
  id: 'leech',
  name: 'Leech',
  description: 'While 3+ enemies are within 80 of you, your hits heal 1 hp. Per rank: +1 hp.',
  maxLevel: 3,
  look: { shape: 'diamond', color: PALETTE.purple },
  onHit(ctx, me, level, hit) {
    if (hit.damage <= 0) return; // 0-damage touches (the goo bubble in flight) are not hits
    let crowd = 0;
    for (const u of ctx.unitsNear(me.x, me.y, 80))
      if (u.alive && u !== me) crowd++;
    if (crowd >= 3) ctx.heal(me, level);
  },
};
