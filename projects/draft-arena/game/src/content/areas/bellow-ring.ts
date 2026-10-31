import type { AreaDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Bellow's ring: an ink-rimed line of ice that blooms out from the bellowing critter, one strike. */
export const bellowRing: AreaDef = {
  id: 'bellow-ring',
  radius: 80,
  life: 0.5, // 0.3 s bloom + 0.2 s fade
  interval: 0.6, // > life: exactly one pulse
  follow: true, // stays centred on the player for the 0.5 s
  look: {
    shape: 'circle',
    color: PALETTE.ice,
    draw(g, e) {
      const t = (1 - e.hp) * 0.5; // seconds since the bellow
      const u = Math.min(1, t / 0.3);
      const bloom = 1 - (1 - u) * (1 - u); // ease out over the first 0.3 s
      const fade = u >= 1 ? Math.max(0, 1 - (t - 0.3) / 0.2) : 1;
      const r = e.radius * bloom;
      if (r < 2) return;
      g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2);
      g.globalAlpha = 0.9 * fade; g.strokeStyle = PALETTE.ink; g.lineWidth = 13; g.stroke(); // ink rim
      g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2);
      g.globalAlpha = 0.85 * fade; g.strokeStyle = PALETTE.ice; g.lineWidth = 9; g.stroke(); // ice line
      g.globalAlpha = 1;
    },
  },
  pulse(ctx, a) {
    if (!a.owner.alive) return;
    for (const u of ctx.enemiesNear(a.owner, a.x, a.y, a.radius)) ctx.strike(a, u);
  },
};
