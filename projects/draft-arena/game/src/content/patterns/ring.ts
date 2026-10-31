import { shade, type PatternDef } from '../../../engine/api.ts';

export const ring: PatternDef = {
  id: 'ring',
  name: 'Ring',
  description: 'A light ring around the middle of the body.',
  price: 150,
  draw(g, w) {
    const r = w.radius;
    g.strokeStyle = shade(w.color, 0.35);
    g.lineWidth = 0.18 * r;
    g.beginPath();
    g.arc(0, 0, r / 3, 0, 2 * Math.PI);
    g.stroke();
  },
};
