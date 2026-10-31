import { traceShape, type EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/**
 * Crown fall: the crown lifts off the fallen leader's head, spins up 60 units and pops into 20
 * stars at the top, while a ring spreads at the spot where the crown (and its gem) landed.
 */
export const crownFall: EffectDef = {
  id: 'crown-fall',
  duration: 1.3,
  draw(g, fx) {
    if (fx.age < 0.9) {
      const t = fx.age / 0.9;
      g.save();
      g.translate(fx.ax, fx.ay - t * 60);
      g.rotate(t * 2);
      crownPath(g);
      g.fillStyle = PALETTE.yellow;
      g.fill();
      g.lineJoin = 'round';
      g.lineWidth = 2.5;
      g.strokeStyle = PALETTE.ink;
      g.stroke();
      g.restore();
    } else if (fx.age < 1.3) {
      const s = (fx.age - 0.9) / 0.4;
      g.globalAlpha = 1 - s;
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2;
        const d = 8 + s * 52;
        g.save();
        g.translate(fx.ax + Math.cos(a) * d, fx.ay - 60 + Math.sin(a) * d);
        g.beginPath();
        traceShape(g, 'star', 6, a);
        g.fillStyle = PALETTE.yellow;
        g.fill();
        g.lineWidth = 2;
        g.strokeStyle = PALETTE.ink;
        g.stroke();
        g.restore();
      }
    }
    if (fx.age < 0.8) {
      const t = fx.age / 0.8;
      const r = 10 + t * 110;
      g.globalAlpha = 1 - t;
      g.lineWidth = 9;
      g.strokeStyle = PALETTE.ink;
      g.beginPath();
      g.arc(fx.ax, fx.ay, r, 0, Math.PI * 2);
      g.stroke();
      g.lineWidth = 5;
      g.strokeStyle = PALETTE.yellow;
      g.stroke();
    }
  },
};

/** A 3-point crown 26 wide and 12 tall, centred on the origin: the crown the leader wears. */
function crownPath(g: CanvasRenderingContext2D): void {
  g.beginPath();
  g.moveTo(-13, 6);
  g.lineTo(-13, -6);
  g.lineTo(-6.5, 2);
  g.lineTo(0, -6);
  g.lineTo(6.5, 2);
  g.lineTo(13, -6);
  g.lineTo(13, 6);
  g.closePath();
}
