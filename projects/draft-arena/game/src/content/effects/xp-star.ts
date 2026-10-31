import { noise, traceShape, type EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

const LIFE = 0.6;

/** Scavenge: one small yellow star rises off the corpse for every xp the kill paid. value: xp paid. */
export const xpStar: EffectDef = {
  id: 'xp-star',
  duration: 1,
  draw(g, fx) {
    const n = Math.max(1, Math.min(9, Math.round(fx.value) || 1));
    for (let i = 0; i < n; i++) {
      const a = fx.age - i * 0.04;
      if (a <= 0 || a >= LIFE) continue;
      const t = a / LIFE;
      const x = fx.ax + (noise(fx.seed, i) - 0.5) * 24;
      const y = fx.ay - 28 * t;
      g.globalAlpha = 1 - t;
      g.save();
      g.translate(x, y);
      g.beginPath();
      traceShape(g, 'star', 6, t * 3);
      g.fillStyle = PALETTE.yellow;
      g.fill();
      g.lineWidth = 2;
      g.strokeStyle = PALETTE.ink;
      g.stroke();
      g.restore();
    }
    g.globalAlpha = 1;
  },
};
