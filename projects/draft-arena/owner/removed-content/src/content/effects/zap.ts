import type { EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A zigzag spark from a to b (Chain's jump). */
export const zap: EffectDef = {
  id: 'zap',
  duration: 0.2,
  draw(g, fx) {
    const dx = fx.bx - fx.ax;
    const dy = fx.by - fx.ay;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    g.globalAlpha = 1 - fx.t;
    g.lineJoin = 'round';
    g.lineCap = 'round';
    g.beginPath();
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const f = i / steps;
      const off = i === 0 || i === steps ? 0 : i % 2 ? 6 : -6;
      const x = fx.ax + dx * f + nx * off;
      const y = fx.ay + dy * f + ny * off;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.strokeStyle = PALETTE.ink;
    g.lineWidth = 6;
    g.stroke();
    g.strokeStyle = PALETTE.yellow;
    g.lineWidth = 3;
    g.stroke();
  },
};
