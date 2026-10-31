import type { ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/**
 * Circles its owner. A path that uses the owner's position: p1 is the turn speed (radians per second
 * times 100), p2 the distance from the owner.
 */
export const orbit: ProjectileDef = {
  id: 'orbit',
  radius: 10,
  life: 3,
  pierce: 99,
  look: { shape: 'square', color: PALETTE.teal },
  path(s, t, owner) {
    const a = s.angle + (t * s.p1) / 100;
    return { x: owner.x + Math.cos(a) * s.p2, y: owner.y + Math.sin(a) * s.p2 };
  },
};
