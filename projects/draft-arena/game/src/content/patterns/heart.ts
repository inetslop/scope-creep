import { shade, type PatternDef } from '../../../engine/api.ts';

export const heart: PatternDef = {
  id: 'heart',
  name: 'Heart',
  description: 'A light heart on the middle of the body.',
  price: 200,
  draw(g, w) {
    const r = w.radius;
    g.fillStyle = shade(w.color, 0.35);
    g.beginPath();
    g.ellipse(-0.14 * r, -0.1 * r, 0.18 * r, 0.18 * r, 0, 0, Math.PI * 2);
    g.ellipse(0.14 * r, -0.1 * r, 0.18 * r, 0.18 * r, 0, 0, Math.PI * 2);
    g.moveTo(-0.32 * r, 0);
    g.lineTo(0.32 * r, 0);
    g.lineTo(0, 0.5 * r);
    g.closePath();
    g.fill();
  },
};
