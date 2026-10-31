import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A beanie over the top of the head: a purple dome and a folded band, a pink pom on top. */
export const beanie: AccessoryDef = {
  id: 'beanie',
  name: 'Beanie',
  description: 'A purple beanie with a pink pom.',
  slot: 'head',
  price: 0,
  draw(g, w) {
    const r = w.radius;
    g.lineJoin = 'round';
    g.lineWidth = 0.14 * r;
    g.strokeStyle = w.ink;
    // The dome, a little wider than the head, over its top.
    g.beginPath();
    g.arc(0, 0, 0.98 * r, Math.PI + 0.7, Math.PI * 2 - 0.7);
    g.closePath();
    g.fillStyle = PALETTE.purple;
    g.fill();
    g.stroke();
    // The folded band across the bottom of the dome.
    g.beginPath();
    g.rect(-0.72 * r, -0.84 * r, 1.44 * r, 0.3 * r);
    g.fillStyle = PALETTE.purple;
    g.fill();
    g.stroke();
    // Ribs in the band.
    g.lineWidth = 0.06 * r;
    for (const x of [-0.45, -0.15, 0.15, 0.45]) {
      g.beginPath();
      g.moveTo(x * r, -0.8 * r);
      g.lineTo(x * r, -0.58 * r);
      g.stroke();
    }
    // The pom on top.
    g.lineWidth = 0.14 * r;
    g.beginPath();
    g.arc(0, -1.25 * r, 0.32 * r, 0, Math.PI * 2);
    g.fillStyle = PALETTE.pink;
    g.fill();
    g.stroke();
  },
};
