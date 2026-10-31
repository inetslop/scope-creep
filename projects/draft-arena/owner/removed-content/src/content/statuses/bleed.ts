import type { StatusDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** 3 damage a second per stack; the kill goes to whoever made it bleed (mem.bleedBy). */
export const bleeding: StatusDef = {
  id: 'bleed',
  name: 'Bleeding',
  color: PALETTE.red,
  maxStacks: 5,
  tick(ctx, u, dt, stacks) {
    ctx.damage(u, 3 * stacks * dt, ctx.playerById(u.mem.bleedBy ?? 0));
  },
};
