import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A striped orange and white candy on the side of the head, with two white wrapper twists. */
export const candy: AccessoryDef = {
  id: 'candy',
  name: 'Candy',
  description: 'A striped orange and white candy on the side of the head.',
  slot: 'head',
  price: 240,
  draw(g, w) {
    const r = w.radius;
    const by = Math.sin(w.time * 2 + w.seed * 6.283) * 0.05 * r;
    const cx = 0.92 * r;
    const cy = -0.35 * r + by;
    const ex = cx - 0.35 * r; // the left end of the body
    g.lineJoin = 'round';
    g.lineCap = 'round';
    g.lineWidth = 0.12 * r;
    // The two white wrapper twists at the left end, behind the body: fill then ink stroke.
    for (const m of [-1, 1]) {
      g.beginPath();
      g.moveTo(ex - 0.18 * r, cy + 0.06 * r * m);
      g.lineTo(ex, cy + 0.12 * r * m);
      g.lineTo(ex, cy);
      g.closePath();
      g.fillStyle = PALETTE.white;
      g.fill();
      g.strokeStyle = w.ink;
      g.stroke();
    }
    // The orange body with its ink outline, over the twists' bases: one shared outline.
    g.beginPath();
    g.ellipse(cx, cy, 0.35 * r, 0.225 * r, 0, 0, Math.PI * 2);
    g.fillStyle = PALETTE.orange;
    g.fill();
    g.stroke();
    // The three white vertical stripes, clipped to the body.
    g.save();
    g.clip();
    for (const dx of [-0.16, 0, 0.16]) {
      g.beginPath();
      g.rect(cx + (dx - 0.05) * r, cy - 0.225 * r, 0.1 * r, 0.45 * r);
      g.fillStyle = PALETTE.white;
      g.fill();
    }
    g.restore();
    // One small white shine, in the orange gap left of the first stripe.
    g.beginPath();
    g.arc(cx - 0.24 * r, cy - 0.1 * r, 0.05 * r, 0, Math.PI * 2);
    g.fillStyle = PALETTE.white;
    g.fill();
  },
};
