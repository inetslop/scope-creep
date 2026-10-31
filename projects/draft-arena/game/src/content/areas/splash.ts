import type { AreaDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/**
 * Where a bubble lands: a short ice field on the ground that strikes everything inside it (monsters
 * and players alike, players for half). Each strike marks the unit, so a kill by the splash is a
 * kill the Fuse capstone can pop. The engine draws it as a faint ice circle.
 */
export const splash: AreaDef = {
  id: 'splash',
  radius: 70,
  life: 0.6,
  interval: 0.15,
  look: { shape: 'circle', color: PALETTE.ice },
  pulse(ctx, a) {
    for (const u of ctx.enemiesNear(a.owner, a.x, a.y, a.radius)) {
      u.mem.splashAt = ctx.time;
      ctx.strike(a, u);
    }
  },
};
