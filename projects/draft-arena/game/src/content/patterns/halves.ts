import { shade, type PatternDef } from '../../../engine/api.ts';

export const halves: PatternDef = {
  id: 'halves',
  name: 'Halves',
  description: 'The top half of the body, lighter, like a two-tone critter.',
  price: 50,
  draw(g, w) {
    const r = w.radius;
    g.fillStyle = shade(w.color, 0.35);
    g.beginPath();
    g.arc(0, 0, r, Math.PI, 0);
    g.closePath();
    g.fill();
  },
};
