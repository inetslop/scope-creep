import { traceShape, type StatusDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/**
 * The green sash (tier 2 of The streak, directors/streak.ts): from a third knockout in the chain,
 * the same band and chest star as streak-gold in the rewards green; while it shows, every kill
 * pays +2 coins.
 */
export const streakGreen: StatusDef = {
  id: 'streak-green',
  name: 'On a streak',
  color: PALETTE.green,
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
    g.fillStyle = PALETTE.green;
    g.fillRect(-w / 2, -r, w, 2 * r);
    g.restore();
    const s = 5 * (1 + 0.06 * Math.sin(v.time * Math.PI * 2)); // chest star, pulsing once a second
    g.beginPath();
    traceShape(g, 'star', s, 0);
    g.fillStyle = PALETTE.green;
    g.fill();
    g.lineWidth = 2;
    g.lineJoin = 'round';
    g.strokeStyle = v.ink;
    g.stroke();
  },
};
