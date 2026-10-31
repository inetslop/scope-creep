import { noise, type EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';
import { pop as popSound } from '../../audio/sfx.ts';

const COLORS = [PALETTE.red, PALETTE.yellow, PALETTE.teal, PALETTE.pink, PALETTE.blue];

/** A monster pops into confetti where it died (value: its radius). */
export const pop: EffectDef = {
  id: 'pop',
  duration: 0.45,
  draw(g, fx) {
    popSound(fx.seed, fx.value, fx.age);
    g.globalAlpha = 1 - fx.t;
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + noise(fx.seed, i) * 0.6;
      const d = fx.value * 0.4 + fx.t * (fx.value + 18) * (0.8 + 0.4 * noise(fx.seed, i + 9));
      g.fillStyle = COLORS[i % COLORS.length]!;
      g.beginPath();
      g.arc(fx.ax + Math.cos(a) * d, fx.ay + Math.sin(a) * d, 4 * (1 - fx.t) + 1.5, 0, Math.PI * 2);
      g.fill();
    }
  },
};
