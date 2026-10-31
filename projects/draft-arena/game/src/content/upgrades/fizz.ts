import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/**
 * Lobber capstone beside Fuse: the splash itself lingers. One fizz-puddle per splash, at the
 * splash's spot, as big as it; the puddle's own strikes (a different area) lay none.
 */
export const fizz: UpgradeDef = {
  id: 'fizz',
  name: 'Fizz',
  description: "When your bubble's splash lands, it lingers 2.5 s and strikes everything inside every 0.5 s for 3 damage. The puddle is as big as the splash.",
  maxLevel: 1,
  look: { shape: 'circle', color: PALETTE.ice },
  onHit(ctx, me, _level, hit) {
    const a = hit.area;
    if (!a || a.def.id !== 'splash') return; // only the bubble's splash; never the puddle's own strikes
    if (a.slots[0] === 1) return; // this splash already fizzed: one puddle per splash
    a.slots[0] = 1;
    // The engine multiplies the area's radius by my area stat, so divide to land on the splash's
    // final radius: a Wide splash leaves a puddle as big as it.
    ctx.area(me, 'fizz-puddle', { x: a.x, y: a.y, radius: a.radius / me.stats.area, damage: 3 });
  },
};
