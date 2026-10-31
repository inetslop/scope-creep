import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Hive sustain: a kill in a crowd feeds back - 2 hp per critter standing by the corpse, up to 3. */
export const nest: UpgradeDef = {
  id: 'nest',
  name: 'Nest',
  description: 'On a kill: heal 2 hp per other critter within 100 of the corpse (up to 3). Per rank: +2 more per neighbor.',
  maxLevel: 3,
  look: { shape: 'hexagon', color: PALETTE.green },
  onKill(ctx, me, level, victim) {
    const n = Math.min(3, ctx.unitsNear(victim.x, victim.y, 100).length);
    if (n > 0) ctx.heal(me, 2 * level * n);
  },
};
