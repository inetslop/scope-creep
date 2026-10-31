import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A small pinwheel on a stick: four blades that turn, two pink and two white. */
export const pinwheel: AccessoryDef = {
  id: 'pinwheel',
  name: 'Pinwheel',
  description: 'A pink and white pinwheel that turns on a stick, on the back.',
  slot: 'back',
  price: 240,
  draw(g, w) {
    const r = w.radius;
    // The Party Blower's small speed sway, on the head only (the spin itself never uses speed).
    const sway = Math.min(1, w.speed / 200) * Math.sin(w.time * 5 + w.seed) * 0.08 * r;
    const cx = 1.1 * r + sway; // head centre, right of the back
    const cy = 0.25 * r;
    // The stick: a thin ink line up off the back, to the head's lower edge.
    g.strokeStyle = w.ink;
    g.lineCap = 'round';
    g.lineWidth = Math.max(1.5, r * 0.08);
    g.beginPath();
    g.moveTo(0.5 * r, 1.25 * r);
    g.lineTo(cx, cy + 0.35 * r);
    g.stroke();
    // The blades: four triangles, one full turn every 4 s, computed from time alone.
    const spin = (w.time / 4) * Math.PI * 2;
    g.lineWidth = Math.max(1, r * 0.06);
    for (let i = 0; i < 4; i++) {
      const th = spin + (i * Math.PI) / 2;
      g.fillStyle = i % 2 === 0 ? PALETTE.pink : PALETTE.white;
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + Math.cos(th) * 0.45 * r, cy + Math.sin(th) * 0.45 * r); // tip
      g.lineTo(cx + Math.cos(th + 0.9) * 0.22 * r, cy + Math.sin(th + 0.9) * 0.22 * r); // swept base
      g.closePath();
      g.fill();
      g.stroke();
    }
    // The small yellow hub over where the blades meet.
    g.fillStyle = PALETTE.yellow;
    g.beginPath();
    g.arc(cx, cy, 0.12 * r, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  },
};
