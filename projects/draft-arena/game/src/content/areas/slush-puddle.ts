import { type AreaDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

const INTERVAL = 0.5;

/**
 * Where Slush's blob lands: a 40-unit puddle that strikes and slows everything standing in it,
 * monsters and players alike, for 2.5 s plus 0.5 s per rank.
 */
export const slushPuddle: AreaDef = {
  id: 'slush-puddle',
  radius: 40,
  life: 2.5,
  interval: INTERVAL,
  look: { color: PALETTE.ice, shape: 'circle' },
  pulse(ctx, a) {
    for (const u of ctx.unitsNear(a.x, a.y, a.radius)) {
      ctx.strike(a, u);
      ctx.addStatus(u, 'slushed', INTERVAL);
    }
  },
};
