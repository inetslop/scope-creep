import { shade, traceShape, type PatternDef } from '../../../engine/api.ts';

export const star: PatternDef = {
  id: 'star',
  name: 'Star',
  description: 'A light star on the middle of the body.',
  price: 100,
  draw(g, w) {
    const r = w.radius;
    g.fillStyle = shade(w.color, 0.35);
    g.beginPath();
    traceShape(g, 'star', 0.5 * r);
    g.fill();
  },
};
