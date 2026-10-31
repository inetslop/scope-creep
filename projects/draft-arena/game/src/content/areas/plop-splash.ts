import type { AreaDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';
import { bloop } from '../../audio/sfx.ts';

/** Where a plop lands: a purple ink-rimmed ring blooms to 60 over 0.2 s, strikes once for 12 (players and monsters alike), then vanishes. */
export const plopSplash: AreaDef = {
  id: 'plop-splash',
  radius: 60,
  life: 0.2,
  interval: 0.4, // longer than life: the first pulse (at once) is the only one
  look: {
    shape: 'circle', color: PALETTE.purple,
    draw(g, e) {
      bloop(e.seed, (1 - e.hp) * 0.2); // the 0.2 s bloom
      const q = Math.min(1, 1 - e.hp); // the bloom: 0 at spawn, 1 at the end (the wire hp is the life left)
      const r = e.radius * q;
      if (r <= 1) return;
      const fade = Math.min(1, e.hp * 4); // fades out over the last quarter
      g.beginPath();
      g.arc(0, 0, r, 0, Math.PI * 2);
      g.globalAlpha = 0.25 * fade;
      g.fillStyle = PALETTE.purple;
      g.fill();
      g.globalAlpha = fade;
      g.lineWidth = 5;
      g.strokeStyle = PALETTE.ink;
      g.stroke();
      g.lineWidth = 2.5;
      g.strokeStyle = PALETTE.purple;
      g.stroke();
      g.globalAlpha = 1;
    },
  },
  pulse(ctx, a) {
    for (const u of ctx.unitsNear(a.x, a.y, a.radius)) {
      if (u === a.owner) continue;
      ctx.strike(a, u);
    }
  },
};
