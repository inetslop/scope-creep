import type { AccessoryDef } from '../../../engine/api.ts';

export const roundGlasses: AccessoryDef = {
  id: 'round-glasses',
  name: 'Round Glasses',
  description: 'Round ink frames around the eyes.',
  slot: 'face',
  price: 80,
  draw(g, w) {
    const r = w.radius;
    g.strokeStyle = w.ink;
    g.lineWidth = Math.max(1.5, r * 0.08);
    g.lineCap = 'round';
    g.beginPath();
    g.arc(-0.34 * r, -0.12 * r, 0.32 * r, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.arc(0.34 * r, -0.12 * r, 0.32 * r, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.moveTo(-0.05 * r, -0.14 * r);
    g.lineTo(0.05 * r, -0.14 * r);
    g.stroke();
  },
};
