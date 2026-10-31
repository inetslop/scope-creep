import { type ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

const FLIGHT = 1.2;

/**
 * Slush's straight-flying slush blob. It never hits in flight: it passes through enemies (pierce
 * 99) so it always reaches where it was aimed, and leaves the slush-puddle area where it lands.
 */
export const slushBlob: ProjectileDef = {
  id: 'slush-blob',
  radius: 8,
  life: FLIGHT,
  pierce: 99,
  look: { shape: 'circle', color: PALETTE.ice },
  path(s, t) {
    return { x: s.x + Math.cos(s.angle) * s.speed * t, y: s.y + Math.sin(s.angle) * s.speed * t };
  },
  onEnd(ctx, p) {
    const rank = p.launch.p1;
    if (p.owner.type === 'player') {
      ctx.area(p.owner, 'slush-puddle', {
        x: p.x,
        y: p.y,
        radius: 40 / p.owner.stats.area,
        damage: 4 + 2 * rank,
        life: 2.5 + 0.5 * rank,
      });
    }
  },
};
