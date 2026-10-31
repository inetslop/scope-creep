import { shade, type PatternDef } from '../../../engine/api.ts';

export const cheeks: PatternDef = {
  id: 'cheeks',
  name: 'Cheeks',
  description: 'Two light dots on the cheeks.',
  price: 120,
  draw(g, w) {
    const r = w.radius;
    g.fillStyle = shade(w.color, 0.35);
    for (const side of [-1, 1]) {
      g.beginPath();
      g.arc(side * 0.45 * r, 0.55 * r, 0.25 * r, 0, Math.PI * 2);
      g.fill();
    }
  },
};
