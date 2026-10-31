import { moveForward, turnToward, type ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/**
 * Turns toward the nearest enemy as it flies. A step: runs on the server only (it needs ctx), and its
 * position is sent every tick, so keep these few.
 */
export const seeker: ProjectileDef = {
  id: 'seeker',
  radius: 6,
  life: 2.4,
  look: { shape: 'triangle', color: PALETTE.blue },
  step(ctx, p, dt) {
    const target = ctx.nearestEnemy(p, 450);
    if (target) turnToward(p, target, 5 * dt);
    moveForward(p, dt);
  },
};
