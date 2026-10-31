import { shade, type AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A big green lollipop with a white swirl on a short stick, the back slot's 500-coin top. */
export const lollipop: AccessoryDef = {
  id: 'lollipop',
  name: 'Lollipop',
  description: 'A big green lollipop with a white swirl. Needs 2 prestiges in all.',
  slot: 'back',
  price: 500,
  prestige: 2,
  draw(g, w) {
    const r = w.radius;
    const bob = Math.min(1, w.speed / 200) * Math.sin(w.time * 2.5 + w.seed) * 0.06 * r;
    const ow = Math.max(1.5, r * 0.08);
    const cx = 1.0 * r; // right side of the back
    const cy = -1.0 * r; // disc centre, one radius above the centre line
    g.save();
    g.translate(0, bob);
    // The stick: an ink line up the right side, to the disc's lower edge.
    g.strokeStyle = w.ink;
    g.lineWidth = ow;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(cx, 0.5 * r);
    g.lineTo(cx, -0.4 * r);
    g.stroke();
    // The disc: green, 1.2 radii across, with its ink outline.
    g.fillStyle = PALETTE.green;
    g.beginPath();
    g.arc(cx, cy, 0.6 * r, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    // The swirl: 2 turns, round-capped, the Lolly pattern's light shade on green.
    g.strokeStyle = shade(PALETTE.green, 0.35);
    g.lineWidth = 0.12 * r;
    g.beginPath();
    const max = 2 * Math.PI * 2; // 2 turns
    for (let i = 0; i <= 48; i++) {
      const th = (i / 48) * max;
      const rad = (th / max) * 0.4 * r;
      const x = cx + Math.cos(th) * rad;
      const y = cy + Math.sin(th) * rad;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
    g.restore();
  },
};
