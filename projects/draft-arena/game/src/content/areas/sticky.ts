import type { AreaDef } from '../../../engine/api.ts';
import { shade } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/**
 * A sticky patch where a Snail sank: for 6 s whatever stands in it is mired (60% speed). The stain
 * fades in under the Snail (slots[0], driven by age in the pulse) and out as it wears off (hp).
 */
export const sticky: AreaDef = {
  id: 'sticky',
  radius: 45,
  life: 6,
  interval: 0.1,
  follow: false,
  look: {
    shape: 'circle',
    color: shade(PALETTE.orange, -0.3),
    draw(g, e) {
      const a = (e.slots[0] ?? 100) / 100 * Math.min(1, e.hp * 5); // fade in, then out
      if (a <= 0) return;
      g.save();
      g.globalAlpha = a;
      g.fillStyle = shade(PALETTE.orange, -0.3);
      g.beginPath();
      g.arc(0, 0, e.radius, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = 3;
      g.lineCap = 'round';
      g.strokeStyle = PALETTE.ink;
      g.stroke();
      g.beginPath(); // a small snail-print ring inside the stain
      g.arc(0, 0, e.radius * 0.45, 0, Math.PI * 2);
      g.setLineDash([4, 6]);
      g.lineWidth = 1.5;
      g.stroke();
      g.restore();
    },
  },
  pulse(ctx, a) {
    a.slots[0] = Math.min(100, Math.round((a.age / 0.3) * 100));
    for (const u of ctx.unitsNear(a.x, a.y, a.radius)) ctx.addStatus(u, 'mired', 0.5);
  },
};
