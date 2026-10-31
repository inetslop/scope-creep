import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A small red kiss mark on the cheek: two little ink-outlined lips. */
export const kiss: AccessoryDef = {
  id: 'kiss',
  name: 'Kiss',
  description: 'A small red kiss mark on the cheek.',
  slot: 'face',
  price: 300,
  draw(g, w) {
    const r = w.radius;
    const bob = Math.sin(w.time * 1.5 + w.seed * 6.283) * 0.025 * r;
    const cx = 0.52 * r; // right cheek: below and beside the eye, above the mouth line
    const cy = 0.24 * r + bob;
    g.lineCap = 'round';
    // Two little red lips: a shallow "w" across the cheek, ink-outlined.
    for (const side of [-1, 1] as const) {
      g.beginPath();
      g.arc(cx + side * 0.045 * r, cy, 0.045 * r, 0, Math.PI); // lower half-disk: the lip bump
      g.closePath();
      g.fillStyle = PALETTE.red;
      g.fill();
      g.strokeStyle = w.ink;
      g.lineWidth = Math.max(1.5, r * 0.06);
      g.stroke();
    }
    // A tiny white glint on the left lip.
    g.beginPath();
    g.arc(cx - 0.04 * r, cy + 0.015 * r, 0.014 * r, 0, Math.PI * 2);
    g.fillStyle = PALETTE.white;
    g.fill();
  },
};
