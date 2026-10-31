import { shade, type PatternDef } from '../../../engine/api.ts';

export const belly: PatternDef = {
  id: 'belly',
  name: 'Belly',
  description: 'A light round patch on the lower body.',
  price: 40,
  draw(g, w) {
    const r = w.radius;
    g.fillStyle = shade(w.color, 0.35);
    g.beginPath();
    g.arc(0, 0.6 * r, 0.5 * r, 0, Math.PI * 2);
    g.fill();
  },
};
