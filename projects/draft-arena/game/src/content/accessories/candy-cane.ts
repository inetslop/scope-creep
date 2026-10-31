import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A red and white striped cane, hooked over the back, the hook up over one shoulder. */
export const candyCane: AccessoryDef = {
  id: 'candy-cane',
  name: 'Candy Cane',
  description: 'A red and white striped cane hooked over the back.',
  slot: 'back',
  price: 300,
  draw(g, w) {
    const r = w.radius;
    const sway = Math.min(1, w.speed / 200) * Math.sin(w.time * 4 + w.seed * 3) * 0.045;
    const ow = Math.max(1.5, r * 0.08);
    const tube = 0.3 * r;
    g.lineJoin = 'round';
    g.lineCap = 'round';
    g.save();
    g.translate(0.55 * r, 1.35 * r);
    g.rotate(sway);
    // The cane: straight up from the back, then a hook over the shoulder.
    const path = () => {
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(0, -2.45 * r);
      g.arc(-0.3 * r, -2.45 * r, 0.3 * r, 0, -Math.PI, true);
    };
    // Ink outline, then white, then the red stripes on top.
    path();
    g.lineWidth = tube + 2 * ow;
    g.strokeStyle = w.ink;
    g.stroke();
    path();
    g.lineWidth = tube;
    g.strokeStyle = PALETTE.white;
    g.stroke();
    path();
    g.setLineDash([0.3 * r, 0.3 * r]);
    g.strokeStyle = PALETTE.red;
    g.stroke();
    g.setLineDash([]);
    g.restore();
  },
};
