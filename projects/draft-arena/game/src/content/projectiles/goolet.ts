import { moveForward, turnToward, type ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/**
 * Scatter's mini-Goo: a small blue drop chasing the enemy it was sent after (its spot, packed in
 * the launch by Scatter, re-acquired each tick so it tracks movement). It never pops again.
 */
export const goolet: ProjectileDef = {
  id: 'goolet', radius: 8, life: 1, look: { shape: 'circle', color: PALETTE.blue },
  step(ctx, p, dt) {
    const tx = p.launch.p1, ty = p.launch.p2; // its target's spot (set by Scatter)
    const t = ctx.enemiesNear(p, tx, ty, 120)[0]; // re-acquire, so it tracks the moving enemy
    turnToward(p, { x: t ? t.x : tx, y: t ? t.y : ty }, 6 * dt);
    moveForward(p, dt);
  },
};
