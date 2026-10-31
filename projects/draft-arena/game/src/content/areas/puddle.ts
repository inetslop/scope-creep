import { shade, type AreaDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/**
 * Where a Goo killed: for 3 s whatever stands in it (players and monsters alike) is sloshed
 * (80% speed, refreshed on every pulse). The puddle fades in under the kill and out as it wears off.
 */
export const puddle: AreaDef = {
  id: 'puddle', radius: 40, life: 3, interval: 0.25, follow: false,
  look: {
    shape: 'circle', color: shade(PALETTE.teal, -0.2),
    draw(g, e) {
      const a = (e.slots[0] ?? 100) / 100 * Math.min(1, e.hp * 4); // fade in, then out
      if (a <= 0) return;
      g.save(); g.globalAlpha = a;
      g.fillStyle = shade(PALETTE.teal, -0.2);
      g.beginPath(); g.arc(0, 0, e.radius, 0, Math.PI * 2); g.fill();
      g.lineWidth = 3; g.lineCap = 'round'; g.strokeStyle = PALETTE.ink; g.stroke();
      g.beginPath(); g.arc(0, 0, e.radius * 0.5, 0, Math.PI * 2);
      g.setLineDash([4, 6]); g.lineWidth = 1.5; g.stroke();
      g.restore();
    },
  },
  pulse(ctx, a) {
    a.slots[0] = Math.min(100, Math.round((a.age / 0.3) * 100));
    const o = a.owner;
    const saps = o.type === 'player' && (o.mem.snare ?? -1) === o.prestige; // Snare stamped this life
    for (const u of ctx.unitsNear(a.x, a.y, a.radius)) {
      ctx.addStatus(u, 'goo-slow', 1.5);
      if (saps && ctx.statusOf(u, 'sapped') <= 0) {
        u.mem.sapBorn = Math.round(ctx.time * 100);
        ctx.area(o, 'sapped-drop', { x: u.x, y: u.y });
      }
      if (saps) ctx.addStatus(u, 'sapped', 1); // refreshed while it stands in
    }
  },
};
