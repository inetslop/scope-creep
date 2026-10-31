import { shade, type PatternDef } from '../../../engine/api.ts';

export const diagonal: PatternDef = {
  id: 'diagonal',
  name: 'Diagonal',
  description: 'Two light diagonal stripes across the body.',
  price: 60,
  draw(g, w) {
    const r = w.radius;
    g.save();
    g.rotate(-Math.PI / 4);
    g.fillStyle = shade(w.color, 0.35);
    g.fillRect(-r, -0.35 * r, r * 2, r * 0.4);
    g.fillRect(-r, 0.42 * r, r * 2, r * 0.4);
    g.restore();
  },
};
