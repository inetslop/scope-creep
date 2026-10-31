import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Scavenge: a monster kill pays xp per other living critter within 80 of the corpse (up to 3). */
export const scavenge: UpgradeDef = {
  id: 'scavenge',
  name: 'Scavenge',
  description: 'A monster kill is worth +1 xp per other living critter within 80 of the corpse (up to 3). Per rank: +1 more per neighbor.',
  maxLevel: 3,
  look: { shape: 'star', color: PALETTE.yellow },
  onKill(ctx, me, level, victim) {
    if (victim.type !== 'monster') return;
    const n = Math.min(3, ctx.unitsNear(victim.x, victim.y, 80).length);
    if (n > 0) {
      ctx.giveXp(me, level * n);
      ctx.effect('xp-star', { x: victim.x, y: victim.y }, undefined, level * n);
    }
  },
};
