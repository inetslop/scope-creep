import { chase, drawCritter, type Face, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A fat grinning blob: when a player is close its smile shows fangs, and standing on it as it dies takes 10. */
export const popper: MonsterDef = {
  id: 'popper',
  name: 'Popper',
  description: 'Standing on it as it dies costs 10.',
  hp: 50,
  speed: 35,
  radius: 20,
  damage: 10,
  xp: 4,
  weight: 4,
  fromLevel: 3,
  look: {
    shape: 'circle',
    color: PALETTE.red,
    draw(g, e) {
      const face: Face = (e.slots[0] ?? 0) === 1
        ? { mood: 'happy', eyes: 2, mouth: 'teeth' } // the grin shows fangs right before it pops
        : { mood: 'happy', eyes: 2, mouth: 'smile' };
      drawCritter(g, this, e, { ink: PALETTE.ink, face });
    },
  },
  think(ctx, m, _dt) {
    m.slots[0] = ctx.nearestEnemy(m, 60) ? 1 : 0;
    chase(m);
  },
  onDeath(ctx, m) {
    ctx.area(m, 'pop-puff', { damage: 10 });
    ctx.effect('puff-burst', { x: m.x, y: m.y });
  },
};
