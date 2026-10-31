import type { AreaDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/**
 * Bop's pop: one strike for the burst radius, invisible, and no splash where it popped. The rank is
 * carried in the life (0.2 * rank, which the engine does not scale); Wide never sees it, because the
 * strike range comes from the rank, not from the radius stat.
 */
export const bopBurst: AreaDef = {
  id: 'bop-burst',
  radius: 1, // the strike range comes from the rank; 1 unit is not seen
  life: 0.6, // firing site sets it: 0.2 * rank
  interval: 60, // pulses exactly once
  look: { shape: 'circle', color: PALETTE.ice },
  pulse(ctx, a) {
    const rank = Math.min(3, Math.max(1, Math.round(a.life / 0.2)));
    for (const u of ctx.enemiesNear(a.owner, a.x, a.y, 30 + 5 * rank)) ctx.strike(a, u);
  },
};
