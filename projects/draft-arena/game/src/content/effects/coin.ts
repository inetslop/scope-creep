import { noise, type EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

const LIFE = 0.6;

/** A candy coin pops where a kill happened and rises ~30 units while fading. value: coins paid (a knockout throws one per coin, 0.05 s apart). */
export const coin: EffectDef = {
  id: 'coin',
  duration: 1.6,
  draw(g, fx) {
    const n = Math.max(1, Math.min(20, Math.round(fx.value) || 1));
    for (let i = 0; i < n; i++) {
      const a = fx.age - i * 0.05;
      if (a <= 0 || a >= LIFE) continue;
      const t = a / LIFE;
      const x = fx.ax + (noise(fx.seed, i) - 0.5) * 24;
      const y = fx.ay - (24 + noise(fx.seed, i + 100) * 12) * t;
      g.globalAlpha = 1 - t;
      g.fillStyle = PALETTE.yellow;
      g.beginPath();
      g.arc(x, y, 6, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = 2.5;
      g.strokeStyle = PALETTE.ink;
      g.stroke();
      g.fillStyle = PALETTE.white;
      g.beginPath();
      g.arc(x - 2, y - 2, 1.5, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  },
};
