import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const candyPack: AccessoryDef = {
  id: 'candy-pack',
  name: 'Candy Pack',
  description: 'A little green pack on the back.',
  slot: 'back',
  price: 100,
  draw(g, w) {
    const r = w.radius;
    const sway = Math.min(1, w.speed / 200) * Math.sin(w.time * 6 + w.seed) * 0.12 * r;
    g.lineWidth = Math.max(1.5, r * 0.08);
    g.fillStyle = PALETTE.green;
    g.beginPath();
    g.arc(sway, 0.5 * r, 0.75 * r, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = w.ink;
    g.stroke();
    g.fillStyle = PALETTE.yellow;
    g.beginPath();
    g.arc(sway, 1.12 * r, 0.13 * r, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  },
};
