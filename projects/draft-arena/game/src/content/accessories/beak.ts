import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const beak: AccessoryDef = {
  id: 'beak',
  name: 'Beak',
  description: 'A small orange beak below the eyes.',
  slot: 'face',
  price: 100,
  draw(g, w) {
    const r = w.radius;
    const dip = Math.sin(w.time * 3 + w.seed) * 0.02 * r;
    g.lineJoin = 'round';
    g.lineWidth = Math.max(1.5, r * 0.08);
    g.fillStyle = PALETTE.orange;
    g.strokeStyle = w.ink;
    g.beginPath();
    g.moveTo(-0.16 * r, 0.18 * r + dip);
    g.lineTo(0, 0.42 * r + dip);
    g.lineTo(0.16 * r, 0.18 * r + dip);
    g.closePath();
    g.fill();
    g.stroke();
  },
};
