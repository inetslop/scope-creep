import type { ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The Spitter's spit: a small orange drop, straight at 150 u/s, gone on hit or after 1.6 s. */
export const glob: ProjectileDef = {
  id: 'glob',
  radius: 7,
  life: 1.6,
  look: { shape: 'circle', color: PALETTE.orange },
  path(s, t) {
    return { x: s.x + Math.cos(s.angle) * s.speed * t, y: s.y + Math.sin(s.angle) * s.speed * t };
  },
  onHit(_ctx, p) {
    if (p.owner.type === 'monster') p.owner.mem.sg = (p.owner.mem.sg ?? 1) - 1;
  },
  onEnd(_ctx, p) {
    if (p.owner.type === 'monster') p.owner.mem.sg = (p.owner.mem.sg ?? 1) - 1;
  },
};
