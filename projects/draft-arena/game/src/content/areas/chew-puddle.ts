import { noise, shade, type AreaDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/**
 * The Gush puddle of a Chewer, laid at the same spot as the plain one: same slow, and every 0.5 s
 * whatever stands in it takes a tick (monsters full, players half, like the player's other weapons).
 * Standing in it keeps it alive. Drawn over the plain puddle: the squishing bubbles say it hurts.
 */
export const chewPuddle: AreaDef = {
  id: 'chew-puddle',
  radius: 60,
  life: 3,
  interval: 0.5,
  follow: false,
  look: {
    shape: 'circle',
    color: shade(PALETTE.teal, -0.2),
    draw(g, e) {
      const a = (e.slots[0] ?? 100) / 100 * Math.min(1, e.hp * 4); // fade in, then out
      if (a <= 0) return;
      g.save();
      g.globalAlpha = a;
      g.fillStyle = shade(PALETTE.teal, -0.2);
      g.beginPath();
      g.arc(0, 0, e.radius, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = 3;
      g.lineCap = 'round';
      g.strokeStyle = PALETTE.ink;
      g.stroke();
      g.beginPath();
      g.arc(0, 0, e.radius * 0.5, 0, Math.PI * 2);
      g.setLineDash([4, 6]);
      g.lineWidth = 1.5;
      g.stroke();
      const s = Math.sin(((e.time % 0.5) / 0.5) * Math.PI); // 0->1->0: one squish per 0.5 s tick
      g.setLineDash([]);
      for (let i = 0; i < 3; i++) {
        const ang = noise(e.seed, i) * Math.PI * 2;
        const d = (0.2 + 0.45 * noise(e.seed, i + 3)) * e.radius;
        const r = e.radius * (0.08 + 0.05 * noise(e.seed, i + 6));
        g.beginPath();
        g.ellipse(Math.cos(ang) * d, Math.sin(ang) * d, r * (1 + 0.6 * s), r * (1 - 0.45 * s), 0, 0, Math.PI * 2);
        g.fillStyle = shade(PALETTE.teal, 0.35);
        g.fill();
        g.lineWidth = 1.5;
        g.strokeStyle = PALETTE.ink;
        g.stroke();
      }
      g.restore();
    },
  },
  pulse(ctx, a) {
    a.slots[0] = Math.min(100, Math.round((a.age / 0.3) * 100));
    const inIt = ctx.unitsNear(a.x, a.y, a.radius);
    if (inIt.length > 0) a.life = a.age + 3; // refreshed while something stands in it
    for (const u of inIt) {
      ctx.addStatus(u, 'goo-slow', 1.5);
      ctx.damage(u, a.damage, a.owner);
    }
  },
};
