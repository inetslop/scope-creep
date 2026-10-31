import type { ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

const APEX = 140; // the arc's height above the middle of the flight

/** The Toss's lobe: a big purple drop on a high arc. It hits nothing in flight; the splash where it lands is the attack. */
export const plop: ProjectileDef = {
  id: 'plop',
  radius: 12,
  life: 1.25, // the Toss sets it per lobe (distance / speed)
  pierce: 99, // it passes through everything until it lands
  look: { shape: 'circle', color: PALETTE.purple },
  path(s, t) {
    const T = s.p1 / 100 || 1; // flight time, centiseconds from the launch
    const u = Math.min(t, T);
    return {
      x: s.x + Math.cos(s.angle) * s.speed * u,
      y: s.y + Math.sin(s.angle) * s.speed * u - (4 * APEX * u * (T - u)) / (T * T),
    };
  },
  onEnd(ctx, p) {
    ctx.area(p.owner, 'plop-splash', { x: p.x, y: p.y, damage: 12 });
  },
};
