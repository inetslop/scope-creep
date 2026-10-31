import { v, type AreaDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

const CONE = (100 * Math.PI) / 180; // a 100 deg wedge around the locked facing

/** The bite: one strike in a 100 deg wedge, 10 damage, monsters and players alike. */
export const jawBite: AreaDef = {
  id: 'jaw-bite',
  radius: 85,
  life: 0.3,
  interval: 0.4, // > life: exactly one pulse
  look: {
    shape: 'circle',
    color: PALETTE.crimson,
    draw(g, e) {
      const fade = e.hp; // 1 at birth -> 0 at death
      const r = e.radius * (1 - fade); // blooms out to the full radius as it fades
      g.save();
      g.rotate((e.slots[0] ?? 0) / 100); // the locked facing, stored by the pulse
      g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, 0, r, -CONE / 2, CONE / 2);
      g.closePath();
      g.globalAlpha = 0.5 * fade;
      g.fillStyle = PALETTE.crimson;
      g.fill();
      g.globalAlpha = 0.9 * fade;
      g.strokeStyle = PALETTE.ink;
      g.lineWidth = 3;
      g.lineJoin = 'round';
      g.stroke();
      g.restore();
    },
  },
  pulse(ctx, a) {
    if (!a.owner.alive) return;
    const aim = a.owner.mem.ja ?? 0; // the facing the wind-up locked (the area's angle is reset)
    a.slots[0] = Math.round(aim * 100);
    const half = CONE / 2;
    for (const u of ctx.unitsNear(a.x, a.y, a.radius)) {
      if (u.id === a.owner.id) continue;
      let diff = v.angleTo(a, u) - aim;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) <= half) ctx.strike(a, u);
    }
  },
};
