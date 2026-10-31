import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A single pink feather, tilted about 30 degrees, resting on the top of the head. */
export const feather: AccessoryDef = {
  id: 'feather',
  name: 'Feather',
  description: 'A single pink feather resting on the head.',
  slot: 'head',
  price: 120,
  draw(g, w) {
    const r = w.radius;
    const bob = Math.min(1, w.speed / 200) * Math.sin(w.time * 6 + w.seed) * 0.05 * r;
    g.lineJoin = 'round';
    g.save();
    g.translate(-0.1 * r, (-0.95 + bob / r) * r);
    g.rotate(0.52); // tilted about 30 degrees, tip up and to the right
    const L = 1.05 * r;
    g.lineWidth = Math.max(1.5, r * 0.08);
    g.strokeStyle = w.ink;
    g.fillStyle = PALETTE.pink;
    // The leaf: base at (0,0), tip up at (0,-L), a soft rounded leaf.
    g.beginPath();
    g.moveTo(0, 0);
    g.quadraticCurveTo(0.42 * L, -0.32 * L, 0, -L);
    g.quadraticCurveTo(-0.42 * L, -0.32 * L, 0, 0);
    g.fill();
    g.stroke();
    // The quill line down its middle.
    g.lineWidth = Math.max(1, r * 0.05);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(0, -0.82 * L);
    g.stroke();
    g.restore();
  },
};
