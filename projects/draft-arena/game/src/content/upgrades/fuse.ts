import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/**
 * Lobber capstone: a kill by the splash pops. The pop is plain damage (no stat, no re-mark), so a
 * chain only runs while the splash (0.6 s) keeps marking the crowd, and it credits the llobber.
 */
export const fuse: UpgradeDef = {
  id: 'fuse',
  name: 'Fuse',
  description: 'When your bubble kills something, it pops into a ring (radius 50) that deals 10 damage.',
  maxLevel: 1,
  look: { shape: 'star', color: PALETTE.ice },
  onKill(ctx, me, _level, victim) {
    // Only kills by the splash pop: the splash marks each unit it strikes, one tick (0.15 s) at a
    // time, so a mark less than 0.4 s old means the splash dealt the killing blow.
    if (ctx.time - (victim.mem.splashAt ?? -99) > 0.4) return;
    for (const u of ctx.enemiesNear(me, victim.x, victim.y, 50)) ctx.damage(u, 10, me);
    ctx.effect('splash-ring', { x: victim.x, y: victim.y }, undefined, 50);
  },
};
