import { shade, type PatternDef } from '../../../engine/api.ts';

export const smile: PatternDef = {
  id: 'smile',
  name: 'Smile',
  description: 'A light smile across the lower body.',
  price: 180,
  draw(g, w) {
    const r = w.radius;
    g.strokeStyle = shade(w.color, 0.35);
    g.lineWidth = 0.15 * r;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-0.6 * r, 0.35 * r);
    g.quadraticCurveTo(0, 0.75 * r, 0.6 * r, 0.35 * r);
    g.stroke();
  },
};
