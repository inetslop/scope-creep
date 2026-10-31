import { traceShape, type StatusDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/**
 * The golden sash (tier 1 of The streak, directors/streak.ts): a diagonal gold band from the left
 * shoulder to the right hip, ink-rimmed, with a small pulsing chest star. A later tier (tier 2)
 * will be its own status, streak-green; the tier is the status id, the body stays clean.
 */
export const streakGold: StatusDef = {
  id: 'streak-gold',
  name: 'On a streak',
  color: PALETTE.yellow,
  draw(g, v) {
    const r = v.radius;
    g.save();
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.clip();
    g.rotate(-Math.PI / 4); // top of the strip -> top-left (left shoulder), bottom -> bottom-right (right hip)
    const w = r * 0.18;
    g.fillStyle = v.ink;
    g.fillRect(-(w / 2) - 2, -r, w + 4, 2 * r); // 2 px ink rim on each edge
    g.fillStyle = PALETTE.yellow;
    g.fillRect(-w / 2, -r, w, 2 * r);
    g.restore();
    const s = 5 * (1 + 0.06 * Math.sin(v.time * Math.PI * 2)); // chest star, pulsing once a second
    g.beginPath();
    traceShape(g, 'star', s, 0);
    g.fillStyle = PALETTE.yellow;
    g.fill();
    g.lineWidth = 2;
    g.lineJoin = 'round';
    g.strokeStyle = v.ink;
    g.stroke();
  },
};
