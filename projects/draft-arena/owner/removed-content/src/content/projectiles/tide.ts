import { along, v, type ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Tide's giant wave: a big bubble that rolls slowly and passes through everything. */
export const tideWave: ProjectileDef = {
  id: 'tide',
  radius: 24,
  life: 2.4,
  pierce: 99,
  look: {
    shape: 'circle',
    color: PALETTE.teal,
    draw(g, e) {
      const r = e.radius * (1 + Math.sin(e.time * 6 + e.seed) * 0.05);
      g.beginPath();
      g.arc(0, 0, r, 0, Math.PI * 2);
      g.globalAlpha = 0.45;
      g.fillStyle = PALETTE.teal;
      g.fill();
      g.globalAlpha = 1;
      g.lineWidth = 3;
      g.strokeStyle = PALETTE.ink;
      g.stroke();
      g.fillStyle = PALETTE.white;
      g.beginPath();
      g.arc(-r * 0.38, -r * 0.38, r * 0.2, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.arc(-r * 0.1, -r * 0.55, r * 0.09, 0, Math.PI * 2);
      g.fill();
    },
  },
  path(s, t) {
    const side = Math.sin(t * 4 + s.p1) * 24;
    return v.add(along(s, t), v.scale(v.perp(v.fromAngle(s.angle)), side));
  },
};
