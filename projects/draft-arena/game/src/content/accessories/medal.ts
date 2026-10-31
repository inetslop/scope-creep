import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const medal: AccessoryDef = {
  id: 'medal',
  name: 'Medal',
  description: 'A yellow medal with a red ribbon. Needs 2 prestiges in all.',
  slot: 'back',
  price: 400,
  prestige: 2,
  draw(g, w) {
    const r = w.radius;
    const sway = Math.min(1, w.speed / 200) * Math.sin(w.time * 6 + w.seed) * 0.12 * r;
    g.lineWidth = Math.max(1.5, r * 0.08);
    g.strokeStyle = w.ink;
    g.fillStyle = PALETTE.red;
    for (const side of [-1, 1]) {
      g.beginPath();
      g.arc(sway + side * 0.55 * r, 1.08 * r, 0.26 * r, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }
    g.fillStyle = PALETTE.yellow;
    g.beginPath();
    g.arc(sway, 1.2 * r, 0.55 * r, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.fillStyle = PALETTE.white;
    g.beginPath();
    g.arc(sway - 0.2 * r, 1.13 * r, 0.1 * r, 0, Math.PI * 2);
    g.fill();
  },
};
