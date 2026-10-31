import type { AreaDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';
import { RULES } from '../rules.ts';

/**
 * The wound: a thin red collar with an ink rim, 8 units outside the body, on any critter below
 * half hp. The wound director (directors/wound.ts) re-fires it every tick for every critter at
 * or below half: the sweep shrinks with the hp (240 deg at half max hp, nothing at zero), the
 * top 120 deg stays open over the head so hats, the crown, the mark's ring and the prestige
 * stars all read on top of it.
 */
export const wound: AreaDef = {
  id: 'wound',
  radius: 1,
  life: 0.15, // 3 ticks; the director re-fires it every tick, so the collar never disappears
  interval: 1, // > life: the pulse fires once at birth, never again
  follow: true, // stays centred on the wounded critter; ends when it is knocked out
  look: {
    shape: 'circle',
    color: PALETTE.red,
    draw(g, e) {
      const f = (e.slots[0] ?? 0) / 100; // 100 = exactly half max hp: a full 240 deg
      if (f <= 0) return; // full hp: nothing (healed: the last area expires)
      const r = (e.slots[1] ?? RULES.player.radius * 100) / 100 + 8; // 8 outside the body
      const a0 = Math.PI / 2 - (2 * Math.PI / 3) * f; // top edge; the top 120 deg stays open
      const a1 = Math.PI / 2 + (2 * Math.PI / 3) * f; // bottom edge
      g.beginPath();
      g.arc(0, 0, r, a0, a1);
      g.lineWidth = 6;
      g.strokeStyle = PALETTE.ink;
      g.stroke(); // ink rim, like mark.ts
      g.beginPath();
      g.arc(0, 0, r, a0, a1);
      g.lineWidth = 3;
      g.strokeStyle = PALETTE.red;
      g.stroke();
    },
  },
  pulse(_ctx, a) {
    a.slots[0] = Math.min(100, Math.max(0, Math.round((2 * a.owner.hp / a.owner.maxHp) * 100))); // 0..100
    a.slots[1] = Math.round(a.owner.radius * 100); // the collar hugs the owner's body
  },
};
