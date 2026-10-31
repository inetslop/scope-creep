import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

function heart(g: CanvasRenderingContext2D, cx: number, cy: number, s: number): void {
  g.beginPath();
  g.moveTo(cx, cy + 0.75 * s);
  g.bezierCurveTo(cx - 1.5 * s, cy - 0.75 * s, cx - s, cy - 1.25 * s, cx - 0.5 * s, cy - 0.25 * s);
  g.bezierCurveTo(cx + s, cy - 1.25 * s, cx + 1.5 * s, cy - 0.75 * s, cx, cy + 0.75 * s);
}

export const heartShades: AccessoryDef = {
  id: 'heart-shades',
  name: 'Heart Shades',
  description: 'Pink heart frames around the eyes.',
  slot: 'face',
  price: 200,
  draw(g, w) {
    const r = w.radius;
    const bob = Math.min(1, w.speed / 200) * Math.sin(w.time * 6 + w.seed) * 0.1 * r;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (const side of [-1, 1] as const) {
      const cx = side * 0.38 * r;
      const cy = -0.12 * r + bob;
      heart(g, cx, cy, 0.28 * r);
      g.strokeStyle = w.ink;
      g.lineWidth = Math.max(3, r * 0.15);
      g.stroke();
      g.strokeStyle = PALETTE.pink;
      g.lineWidth = Math.max(1.5, r * 0.07);
      g.stroke();
    }
    g.beginPath();
    g.moveTo(-0.14 * r, -0.17 * r + bob);
    g.lineTo(0.14 * r, -0.17 * r + bob);
    g.strokeStyle = w.ink;
    g.lineWidth = Math.max(1.5, r * 0.06);
    g.stroke();
  },
};
