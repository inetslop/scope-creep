import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Seeker capstone: seekers that kill split into two. */
export const swarm: UpgradeDef = {
  id: 'swarm',
  name: 'Swarm',
  description: 'A seeker that knocks out its target splits into two new seekers.',
  maxLevel: 1,
  look: { shape: 'triangle', color: PALETTE.blue, scale: 1.1 },
  onHit(ctx, me, _level, hit) {
    const shot = hit.projectile;
    // p1 counts generations: splits stop after two, so a crowd can't fill the screen with seekers.
    if (!shot || shot.def.id !== 'seeker' || hit.target.hp > 0 || shot.launch.p1 >= 2) return;
    for (const turn of [-0.8, 0.8]) {
      ctx.fire(me, 'seeker', { x: hit.x, y: hit.y, angle: shot.angle + turn, speed: 330, damage: 9, p1: shot.launch.p1 + 1 });
    }
  },
};
