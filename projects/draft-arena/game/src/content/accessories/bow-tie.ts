import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const bowTie: AccessoryDef = {
  id: 'bow-tie',
  name: 'Bow Tie',
  description: 'A red bow tie at the mouth.',
  slot: 'face',
  price: 80,
  draw(g, w) {
    const r = w.radius;
    g.lineWidth = Math.max(1.5, r * 0.08);
    g.lineJoin = 'round';
    g.fillStyle = PALETTE.red;
    g.strokeStyle = w.ink;
    g.beginPath();
    g.moveTo(-0.08 * r, 0.34 * r); g.lineTo(-0.42 * r, 0.42 * r); g.lineTo(-0.08 * r, 0.5 * r);
    g.closePath(); g.fill(); g.stroke();
    g.beginPath();
    g.moveTo(0.08 * r, 0.34 * r); g.lineTo(0.42 * r, 0.42 * r); g.lineTo(0.08 * r, 0.5 * r);
    g.closePath(); g.fill(); g.stroke();
    g.beginPath();
    g.rect(-0.07 * r, 0.35 * r, 0.14 * r, 0.14 * r);
    g.fill(); g.stroke();
  },
};
