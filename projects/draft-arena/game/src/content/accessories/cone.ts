import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A party cone tilted on the top-right of the head, the tip leaning out to the right. */
export const cone: AccessoryDef = {
  id: 'cone',
  name: 'Cone',
  description: 'A yellow party cone with a red tip.',
  slot: 'head',
  price: 0,
  draw(g, w) {
    const r = w.radius;
    g.lineJoin = 'round';
    g.lineWidth = 0.14 * r;
    g.strokeStyle = w.ink;
    // The cone: a tall triangle whose base sits on the rim of the top-right of the head.
    g.beginPath();
    g.moveTo(0.05 * r, -0.998 * r);
    g.lineTo(0.5 * r, -0.866 * r);
    g.lineTo(0.82 * r, -1.75 * r);
    g.closePath();
    g.fillStyle = PALETTE.yellow;
    g.fill();
    g.stroke();
    // The red ball at the tip.
    g.beginPath();
    g.arc(0.84 * r, -1.78 * r, 0.14 * r, 0, Math.PI * 2);
    g.fillStyle = PALETTE.red;
    g.fill();
    g.stroke();
  },
};
