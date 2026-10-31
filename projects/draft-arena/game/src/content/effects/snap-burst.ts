import { noise, type EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';
import { whump } from '../../audio/sfx.ts';

/** Snap: a knockout made while hurt - a red ring with an ink rim blooms out to `value`, red confetti with it. */
export const snapBurst: EffectDef = {
  id: 'snap-burst',
  duration: 0.4,
  draw(g, fx) {
    whump(fx.seed, fx.age);
    g.globalAlpha = 1 - fx.t;
    const r = fx.value * fx.t;
    g.lineWidth = 9;
    g.strokeStyle = PALETTE.ink;
    g.beginPath();
    g.arc(fx.ax, fx.ay, r, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 5;
    g.strokeStyle = PALETTE.red;
    g.stroke();
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2 + noise(fx.seed, i) * 0.6;
      const d = r * (0.6 + 0.4 * noise(fx.seed, i + 20));
      g.fillStyle = PALETTE.red;
      g.beginPath();
      g.arc(fx.ax + Math.cos(a) * d, fx.ay + Math.sin(a) * d, 4 * (1 - fx.t) + 1.5, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = 2;
      g.strokeStyle = PALETTE.ink;
      g.stroke();
    }
  },
};
