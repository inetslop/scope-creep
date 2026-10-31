import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Goober kill: a puddle marks the spot, slowing whatever walks through it. */
export const gush: UpgradeDef = {
  id: 'gush',
  name: 'Gush',
  description:
    'When a Goo kills, a puddle marks the spot: 40 units around it, 20% slower for 1.5 s, refreshed while in it. Each rank: +10 radius.',
  maxLevel: 3,
  look: { shape: 'hexagon', color: PALETTE.teal },
  onKill(ctx, me, level, victim) {
    if (ctx.time - (victim.mem.gooAt ?? -99) > 0.4) return; // only kills a Goo just struck
    ctx.area(me, 'puddle', { x: victim.x, y: victim.y, radius: 40 + 10 * (level - 1) });
  },
};
