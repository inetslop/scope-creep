import { traceShape, type AreaDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';
import { RULES } from '../rules.ts';

/**
 * A player's prestige stars this life (directors/prestige-stars.ts): one small gold star per
 * prestige, up to 3, fanned off the top-right of the head. The count comes in on slots[0] (the
 * 1-second pulse keeps it current); no stats. The follow ends the area on a knockout (when
 * prestiges this life reset); the director re-fires it before the life ends, so the stars do not
 * stay on the field if the player leaves the match.
 */
export const prestigeStars: AreaDef = {
  id: 'prestige-stars',
  radius: 1,
  life: 10, // the director re-fires it 1 s before this expires (directors/prestige-stars.ts)
  interval: 1, // pulse refreshes the count (2nd/3rd star appears within 1 s)
  follow: true,
  look: {
    shape: 'circle',
    color: PALETTE.yellow,
    draw(g, e) {
      const r = (e.slots[1] || RULES.player.radius * 100) / 100; // top of the head is y = -r
      const n = Math.min(3, e.slots[0] ?? 0);
      for (let i = 0; i < n; i++) {
        g.save();
        g.translate(r + 6 + i * 9, -(r + 5) - i * 6); // fan up-right, clear of the crown, under the name
        g.beginPath();
        traceShape(g, 'star', 5, 0);
        g.fillStyle = PALETTE.yellow;
        g.fill();
        g.lineWidth = 2;
        g.lineJoin = 'round';
        g.strokeStyle = PALETTE.ink;
        g.stroke();
        g.restore();
      }
    },
  },
  pulse(_ctx, a) {
    a.slots[0] = a.owner.type === 'player' ? Math.min(3, a.owner.prestige) : 0;
    a.slots[1] = Math.round(a.owner.radius * 100);
  },
};
