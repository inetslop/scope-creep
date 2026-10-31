import type { StatusDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The grudge knot (directors/grudge.ts keeps it on both players of a feud): a small red ribbon knot at the
 * top-left of the critter, mirroring the prestige stars' top-right. One shared outline: two triangular bow
 * tips around a square tie. Clear of the eyes, the crown and the name. */
export const grudgeKnot: StatusDef = {
  id: 'grudge-knot',
  name: 'Grudge',
  color: PALETTE.red,
  above: 8,
  draw(g, v) {
    const s = 0.175 * v.radius; // half the knot's width (0.35r across)
    const q = 0.1 * v.radius; // half the square tie
    g.save();
    g.translate(-(v.radius + 6), -(v.radius + 5)); // mirror of the first prestige star
    g.beginPath();
    g.moveTo(-s, 0);
    g.lineTo(-q, -q);
    g.lineTo(q, -q);
    g.lineTo(s, 0);
    g.lineTo(q, q);
    g.lineTo(-q, q);
    g.closePath();
    g.fillStyle = PALETTE.red;
    g.fill();
    g.lineJoin = 'round';
    g.lineWidth = 2;
    g.strokeStyle = v.ink;
    g.stroke();
    g.restore();
  },
};
