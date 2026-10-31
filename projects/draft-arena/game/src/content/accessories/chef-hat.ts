import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const chefHat: AccessoryDef = {
  id: 'chef-hat',
  name: 'Chef Hat',
  description: 'A tall white puff on the head.',
  slot: 'head',
  price: 300,
  draw(g, w) {
    const r = w.radius;
    const bob = Math.min(1, w.speed / 200) * Math.sin(w.time * 6 + w.seed) * 0.08 * r;
    g.lineWidth = Math.max(1.5, r * 0.08);
    g.fillStyle = PALETTE.white;
    g.strokeStyle = w.ink;
    for (const [x, y, br] of [[0, -1.42, 0.46], [-0.3, -1.5, 0.36], [0.26, -1.52, 0.32]]) {
      g.beginPath();
      g.arc(x * r, (y + bob) * r, br * r, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }
    g.fillStyle = w.ink;
    g.beginPath();
    g.ellipse(0, (-1.08 + bob) * r, 0.56 * r, 0.1 * r, 0, 0, Math.PI * 2);
    g.fill();
  },
};
