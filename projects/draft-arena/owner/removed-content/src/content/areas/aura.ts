import type { AreaDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A field that follows its owner and strikes every enemy in it twice a second. */
export const aura: AreaDef = {
  id: 'aura',
  radius: 85,
  life: 2,
  interval: 0.5,
  follow: true,
  look: { shape: 'circle', color: PALETTE.teal },
  pulse(ctx, a) {
    for (const enemy of ctx.enemiesNear(a, a.x, a.y, a.radius)) ctx.strike(a, enemy);
  },
};
