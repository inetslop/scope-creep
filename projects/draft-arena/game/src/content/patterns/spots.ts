import { shade, type PatternDef } from '../../../engine/api.ts';

export const spots: PatternDef = {
  id: 'spots',
  name: 'Spots',
  description: 'Five dark dots on the body.',
  price: 30,
  draw(g, w) {
    const r = w.radius;
    g.fillStyle = shade(w.color, -0.3);
    for (const [x, y] of [[-0.52, -0.64], [0.52, -0.64], [-0.82, -0.28], [0.82, -0.28], [0, 0.8]] as const) {
      g.beginPath();
      g.arc(x * r, y * r, r * 0.22, 0, Math.PI * 2);
      g.fill();
    }
  },
};
