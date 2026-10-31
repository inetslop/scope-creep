import { shade, type PatternDef } from '../../../engine/api.ts';

export const party: PatternDef = {
  id: 'party',
  name: 'Party',
  description: 'A light zigzag across the top, like a paper party hat.',
  price: 40,
  draw(g, w) {
    const r = w.radius;
    g.fillStyle = shade(w.color, 0.35);
    g.beginPath();
    g.moveTo(-r, -0.42 * r);
    g.lineTo(-r, -0.6 * r);
    g.lineTo(-0.8 * r, -0.85 * r); g.lineTo(-0.6 * r, -0.6 * r);
    g.lineTo(-0.4 * r, -0.85 * r); g.lineTo(-0.2 * r, -0.6 * r);
    g.lineTo(0, -0.85 * r); g.lineTo(0.2 * r, -0.6 * r);
    g.lineTo(0.4 * r, -0.85 * r); g.lineTo(0.6 * r, -0.6 * r);
    g.lineTo(0.8 * r, -0.85 * r); g.lineTo(r, -0.6 * r);
    g.lineTo(r, -0.42 * r);
    g.closePath();
    g.fill();
  },
};
