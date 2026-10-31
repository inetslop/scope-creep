import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A bloom on the top of the head: five rounded pink petals around a yellow center. */
export const bloom: AccessoryDef = {
  id: 'bloom',
  name: 'Bloom',
  description: 'A pink flower with a yellow center on the head.',
  slot: 'head',
  price: 150,
  draw(g, w) {
    const r = w.radius;
    const s = 1 + 0.05 * Math.sin(w.time * 2 + w.seed * 6.283);
    const cx = 0;
    const cy = -0.95 * r;
    g.lineJoin = 'round';
    g.lineWidth = 0.12 * r;
    g.strokeStyle = w.ink;
    // The five petals around the center, a little bounce.
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * 2 * Math.PI / 5;
      g.beginPath();
      g.arc(cx + Math.cos(a) * 0.22 * r * s, cy + Math.sin(a) * 0.22 * r * s, 0.24 * r * s, 0, Math.PI * 2);
      g.fillStyle = PALETTE.pink;
      g.fill();
      g.stroke();
    }
    // The yellow center, on top.
    g.beginPath();
    g.arc(cx, cy, 0.17 * r, 0, Math.PI * 2);
    g.fillStyle = PALETTE.yellow;
    g.fill();
    g.stroke();
  },
};
