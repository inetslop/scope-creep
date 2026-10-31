import { shade, type PatternDef } from '../../../engine/api.ts';

export const lolly: PatternDef = {
  id: 'lolly',
  name: 'Lolly',
  description: 'A light lollipop swirl across the body.',
  price: 80,
  draw(g, w) {
    const r = w.radius;
    g.strokeStyle = shade(w.color, 0.35);
    g.lineWidth = 0.18 * r;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    const max = 1.5 * Math.PI * 2; // 1 and a half turns
    for (let i = 0; i <= 40; i++) {
      const th = (i / 40) * max;
      const rad = (th / max) * r;
      const x = Math.cos(th) * rad;
      const y = Math.sin(th) * rad;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  },
};
