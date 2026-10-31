import { shade, type PatternDef } from '../../../engine/api.ts';

export const bands: PatternDef = {
  id: 'bands',
  name: 'Bands',
  description: 'Two light bands across the body.',
  price: 30,
  draw(g, w) {
    const r = w.radius;
    g.fillStyle = shade(w.color, 0.35);
    g.fillRect(-r, -0.35 * r, r * 2, r * 0.4);
    g.fillRect(-r, 0.42 * r, r * 2, r * 0.4);
  },
};
