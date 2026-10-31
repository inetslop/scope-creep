import { chase, drawCritter, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The basic monster: heads straight for the nearest player (scared while slowed). */
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
      drawCritter(g, this, e, { ink: PALETTE.ink, face: e.slots[0] === 1 ? { mood: 'scared', mouth: 'o' } : { mood: 'angry' } });
    },
  },
  think(ctx, m, _dt) {
    m.slots[0] = ctx.statusOf(m, 'chill-1') + ctx.statusOf(m, 'chill-2') + ctx.statusOf(m, 'chill-3') > 0 ? 1 : 0;
    chase(m);
  },
};
