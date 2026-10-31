import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const monocle: AccessoryDef = {
  id: 'monocle',
  name: 'Monocle',
  description: 'A gold lens over one eye, with a thin chain to the cheek.',
  slot: 'face',
  price: 150,
  draw(g, w) {
    const r = w.radius;
    const cx = 0.34 * r, cy = -0.12 * r, ring = 0.32 * r;
    g.lineCap = 'round';
    g.beginPath();
    g.arc(cx, cy, ring, 0, Math.PI * 2);
    g.strokeStyle = w.ink;
    g.lineWidth = Math.max(3, r * 0.12);
    g.stroke();
    g.strokeStyle = PALETTE.yellow;
    g.lineWidth = Math.max(1.5, r * 0.08);
    g.stroke();
    const sway = Math.min(1, w.speed / 200) * Math.sin(w.time * 5 + w.seed) * 0.05 * r;
    const ex = 0.46 * r + sway, ey = 0.55 * r;
    g.beginPath();
    g.moveTo(cx, cy + ring);
    g.lineTo(ex, ey);
    g.strokeStyle = w.ink;
    g.lineWidth = Math.max(1, r * 0.03);
    g.stroke();
    g.beginPath();
    g.arc(ex, ey, r * 0.04, 0, Math.PI * 2);
    g.fillStyle = w.ink;
    g.fill();
  },
};
