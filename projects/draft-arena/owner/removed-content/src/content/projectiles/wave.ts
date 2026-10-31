import { along, v, type ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/**
 * A bubble that weaves side to side around a straight line. A path: computed from the launch on
 * the server and every client, so only the launch is sent. p1 is the starting phase of the weave.
 */
export const wave: ProjectileDef = {
  id: 'wave',
  radius: 8,
  life: 1.5,
  pierce: 3,
  look: {
    shape: 'circle',
    color: PALETTE.teal,
    draw(g, e) {
      const r = e.radius * (1 + Math.sin(e.time * 9 + e.seed) * 0.06);
      g.beginPath();
      g.arc(0, 0, r, 0, Math.PI * 2);
      g.globalAlpha = 0.4;
      g.fillStyle = PALETTE.teal;
      g.fill();
      g.globalAlpha = 1;
      g.lineWidth = 2.5;
      g.strokeStyle = PALETTE.ink;
      g.stroke();
      g.fillStyle = PALETTE.white;
      g.beginPath();
      g.arc(-r * 0.35, -r * 0.35, r * 0.24, 0, Math.PI * 2);
      g.fill();
    },
  },
  path(s, t) {
    const base = along(s, t);
    const side = Math.sin(t * 10 + s.p1) * 36 * Math.min(1, t * 4);
    return v.add(base, v.scale(v.perp(v.fromAngle(s.angle)), side));
  },
};
