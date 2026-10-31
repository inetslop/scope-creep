import { noise, type EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

const COLORS = [PALETTE.teal, PALETTE.ice, PALETTE.white] as const;

/** Bop's pop: a few candy dots fly out from the hit point. */
export const bopConfetti: EffectDef = {
  id: 'bop-confetti',
  duration: 0.5,
  draw(g, fx) {
    g.save();
    g.globalAlpha = 1 - fx.t;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.4 * noise(fx.seed, i);
      const d = fx.value * (0.2 + 0.8 * fx.t);
      g.beginPath();
      g.arc(fx.ax + Math.cos(a) * d, fx.ay + Math.sin(a) * d, 4 * (1 - fx.t) + 1.5, 0, Math.PI * 2);
      g.fillStyle = COLORS[i % 3];
      g.fill();
      g.lineWidth = 1;
      g.strokeStyle = PALETTE.ink;
      g.stroke();
    }
    g.restore();
  },
};
