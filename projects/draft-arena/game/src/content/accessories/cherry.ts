import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A red cherry with a green stem resting on the top of the head, slightly off-centre. */
export const cherry: AccessoryDef = {
  id: 'cherry',
  name: 'Cherry',
  description: 'A red cherry with a green stem on the head. Needs 1 prestige in all.',
  slot: 'head',
  price: 450,
  prestige: 1,
  draw(g, w) {
    const r = w.radius;
    const s = 1 + 0.05 * Math.sin(w.time * 2 + w.seed * 6.283);
    const cx = 0.12 * r;
    const cy = -1.25 * r;
    g.lineCap = 'round';
    // The green stem out of the top of the ball: an ink curve, then the green on top.
    const stem: [number, string][] = [[0.25 * r, w.ink], [0.09 * r, PALETTE.green]];
    for (const [lw, style] of stem) {
      g.lineWidth = lw;
      g.strokeStyle = style;
      g.beginPath();
      g.moveTo(cx, cy - 0.15 * r);
      g.quadraticCurveTo(cx + 0.05 * r, cy - 0.55 * r, cx + 0.24 * r, cy - 0.62 * r);
      g.stroke();
    }
    // The red ball, over the stem's base.
    g.beginPath();
    g.arc(cx, cy, 0.25 * r * s, 0, Math.PI * 2);
    g.fillStyle = PALETTE.red;
    g.fill();
    g.lineWidth = 0.08 * r;
    g.strokeStyle = w.ink;
    g.stroke();
    // One small white shine.
    g.beginPath();
    g.arc(cx - 0.09 * r, cy - 0.1 * r, 0.06 * r, 0, Math.PI * 2);
    g.fillStyle = PALETTE.white;
    g.fill();
  },
};
