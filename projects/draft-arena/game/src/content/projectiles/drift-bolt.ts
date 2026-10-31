import { along, drawCritter, type ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

const DRIFT_AT = 120;
const SLOW = 0.4;

/** Drift's bolt: full speed for its first 120 units, then 40% of it until its life runs out. */
export const driftBolt: ProjectileDef = {
  id: 'drift-bolt',
  radius: 6,
  life: 0.8, // Every firing site overrides: 0.8 (Drift 1) or 1.2 (Drift 2) after launch.
  look: {
    shape: 'star',
    color: PALETTE.yellow,
    draw(g, e) {
      drawCritter(g, this, e, { ink: PALETTE.ink });
      g.save();
      g.rotate(e.angle);
      g.strokeStyle = PALETTE.ice;
      g.lineWidth = 3;
      g.lineCap = 'round';
      // 3 short ice streaks trailing behind: the slow-motion tail that says which bolts are drifting.
      for (let i = 0; i < 3; i++) {
        const y = (i - 1) * 4;
        g.beginPath();
        g.moveTo(-8 - i * 2, y);
        g.lineTo(-15 - i * 2, y * 1.5);
        g.stroke();
      }
      g.restore();
    },
  },
  path(s, t) {
    if (t * s.speed <= DRIFT_AT) return along(s, t);
    const d = DRIFT_AT + SLOW * s.speed * (t - DRIFT_AT / s.speed);
    return { x: s.x + Math.cos(s.angle) * d, y: s.y + Math.sin(s.angle) * d };
  },
  onEnd(ctx, p) {
    ctx.effect('splash-ring', { x: p.x, y: p.y }, undefined, 30); // small ice ring, ink rim, out to radius 30
  },
};
