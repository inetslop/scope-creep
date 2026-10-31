import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Two pink curls meeting at the centre under the nose, over the mouth, tips hooked up. */
export const mustache: AccessoryDef = {
  id: 'mustache',
  name: 'Mustache',
  description: 'A curly pink mustache over the mouth. Needs 1 prestige in all.',
  slot: 'face',
  price: 350,
  prestige: 1,
  draw(g, w) {
    const r = w.radius;
    const sway = Math.min(1, w.speed / 200) * Math.sin(w.time * 5 + w.seed) * 0.02 * r;
    const ow = Math.max(1.5, r * 0.08);
    const tube = 0.11 * r;
    g.lineJoin = 'round';
    g.lineCap = 'round';
    const path = () => {
      g.beginPath();
      g.moveTo(-0.52 * r, 0.3 * r + sway);
      g.bezierCurveTo(-0.5 * r, 0.44 * r, -0.2 * r, 0.32 * r, 0, 0.3 * r);
      g.bezierCurveTo(0.2 * r, 0.32 * r, 0.5 * r, 0.44 * r, 0.52 * r, 0.3 * r + sway);
    };
    path(); g.lineWidth = tube + 2 * ow; g.strokeStyle = w.ink; g.stroke();
    path(); g.lineWidth = tube; g.strokeStyle = PALETTE.pink; g.stroke();
  },
};
