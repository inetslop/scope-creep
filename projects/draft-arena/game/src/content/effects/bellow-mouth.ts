import type { EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The bellowing critter's mouth, wide open for the length of the bellow. */
export const bellowMouth: EffectDef = {
  id: 'bellow-mouth',
  duration: 0.3,
  draw(g, fx) {
    const open = Math.min(1, fx.age / 0.08);
    const close = fx.age < 0.2 ? 1 : Math.max(0, (0.3 - fx.age) / 0.1);
    const s = open * close;
    if (s <= 0) return;
    g.save();
    g.translate(fx.ax, fx.ay + 7.5); // a 18-radius critter's mouth sits 0.42 r below its centre
    g.scale(s, s);
    g.fillStyle = PALETTE.ink;
    g.beginPath(); g.ellipse(0, 0, 5, 6.5, 0, 0, Math.PI * 2); g.fill();
    g.restore();
  },
};
