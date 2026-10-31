import { v, type AreaDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Maw's bite: a short zone that strikes everything inside once. */
export const bite: AreaDef = {
  id: 'bite',
  radius: 75,
  life: 0.2,
  interval: 0.3, // > life: exactly one pulse
  look: {
    shape: 'circle',
    color: PALETTE.ice,
    draw(g, e) {
      const fade = e.hp; // 1 at birth -> 0 at death
      const r = e.radius;
      g.save();
      g.rotate((e.slots[0] ?? 0) / 100); // aim angle stored by pulse; gap of the jaw faces it
      g.beginPath(); // wide crescent: a 210 deg ring sector, 0.6r..r, open at +x
      g.arc(0, 0, r, 0.75, Math.PI * 2 - 0.75);
      g.arc(0, 0, r * 0.6, Math.PI * 2 - 0.75, 0.75, true);
      g.closePath();
      g.globalAlpha = 0.5 * fade;
      g.fillStyle = PALETTE.ice;
      g.fill();
      g.globalAlpha = 0.9 * fade;
      g.strokeStyle = PALETTE.ink;
      g.lineWidth = 3;
      g.stroke();
      g.restore();
    },
  },
  pulse(ctx, a) {
    if (!a.owner.alive) return;
    const target = ctx.nearestEnemy({ x: a.x, y: a.y, team: a.team }, 240);
    a.slots[0] = target ? Math.round(v.angleTo(a, target) * 100) : 0;
    for (const u of ctx.enemiesNear(a.owner, a.x, a.y, a.radius)) ctx.strike(a, u);
  },
};
