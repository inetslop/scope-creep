import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const balloon: AccessoryDef = {
  id: 'balloon',
  name: 'Balloon',
  description: 'A small yellow balloon bobbing on the back.',
  slot: 'back',
  price: 120,
  draw(g, w) {
    const r = w.radius;
    const bob = Math.min(1, w.speed / 200) * Math.sin(w.time * 6 + w.seed) * 0.15 * r;
    g.lineWidth = Math.max(1.5, r * 0.08);
    g.fillStyle = PALETTE.yellow;
    g.strokeStyle = w.ink;
    g.beginPath();
    g.arc(0, (1.05 + (bob / r)) * r, 0.5 * r, 0, Math.PI * 2);
    g.fill(); g.stroke();
    g.beginPath();
    g.moveTo(0, 0.98 * r); g.lineTo(0.08 * r, 1.06 * r); g.lineTo(0, 1.14 * r); g.lineTo(-0.08 * r, 1.06 * r);
    g.closePath(); g.fill(); g.stroke();
  },
};
