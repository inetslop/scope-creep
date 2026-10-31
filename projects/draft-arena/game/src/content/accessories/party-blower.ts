import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const partyBlower: AccessoryDef = {
  id: 'party-blower',
  name: 'Party Blower',
  description: 'A red party blower, rolled up on a stick, on the back.',
  slot: 'back',
  price: 180,
  draw(g, w) {
    const r = w.radius;
    // gentler than the Balloon's bob: smaller amplitude, slower
    const sway = Math.min(1, w.speed / 200) * Math.sin(w.time * 5 + w.seed) * 0.08 * r;
    g.lineWidth = Math.max(1.5, r * 0.08);
    g.strokeStyle = w.ink;
    // stick: base on the back, rising up and to the right
    const bx = 0.5 * r, by = 1.25 * r;
    const tx = bx + 0.55 * r + sway, ty = by - 0.95 * r;
    g.beginPath();
    g.moveTo(bx, by);
    g.lineTo(tx, ty);
    g.stroke();
    // red spiral head (the rolled horn)
    g.fillStyle = PALETTE.red;
    g.beginPath();
    g.arc(tx, ty, 0.35 * r, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    // inner roll line so it reads as a rolled horn
    g.beginPath();
    g.arc(tx, ty, 0.18 * r, 0, Math.PI * 1.5);
    g.stroke();
    // white tip: a small point at the far end of the horn
    g.fillStyle = PALETTE.white;
    g.beginPath();
    g.moveTo(tx + 0.28 * r, ty - 0.06 * r);
    g.lineTo(tx + 0.44 * r, ty - 0.2 * r);
    g.lineTo(tx + 0.36 * r, ty - 0.34 * r);
    g.closePath();
    g.fill();
    g.stroke();
  },
};
