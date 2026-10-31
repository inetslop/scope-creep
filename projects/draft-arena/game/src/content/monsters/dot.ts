import { chase, drawCritter, type Face, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The basic monster: heads straight for the nearest player (scared while slowed, calm while marching). */
export const dot: MonsterDef = {
  id: 'dot',
  name: 'Dot',
  description: 'Heads straight for the nearest player.',
  hp: 12,
  speed: 85,
  radius: 14,
  damage: 12,
  xp: 1,
  weight: 10,
  fromLevel: 1,
  look: {
    shape: 'circle',
    color: PALETTE.red,
    draw(g, e) {
      const face: Face =
        e.slots[1] === 1 ? { mood: 'calm', eyes: 1, mouth: 'o' }
        : e.slots[0] === 1 ? { mood: 'scared', mouth: 'o' }
        : { mood: 'angry' };
      drawCritter(g, this, e, { ink: PALETTE.ink, face });
    },
  },
  think(ctx, m, _dt) {
    if (m.mem.surge === 1) {
      const { width, height } = ctx.rules.world;
      const dx = width / 2 - m.x;
      const dy = height / 2 - m.y;
      const d = Math.hypot(dx, dy);
      if (d <= 40 || ctx.nearestEnemy(m, 60)) {
        m.mem.surge = 0;
        m.slots[1] = 0;
      } else {
        m.vx = (dx / d) * m.speed;
        m.vy = (dy / d) * m.speed;
        m.angle = Math.atan2(dy, dx);
        m.slots[1] = 1;
      }
      return;
    }
    m.slots[0] = ctx.statusOf(m, 'chill-1') + ctx.statusOf(m, 'chill-2') + ctx.statusOf(m, 'chill-3') > 0 ? 1 : 0;
    m.slots[1] = 0;
    chase(m);
  },
};
