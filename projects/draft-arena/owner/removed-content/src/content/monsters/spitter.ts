import { v, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Keeps its distance and spits at its target every 2.4 s. The example of a monster that fires. */
export const spitter: MonsterDef = {
  id: 'spitter',
  name: 'Spitter',
  description: 'Keeps about 300 away and spits a slow shot every 2.4 s.',
  hp: 16,
  speed: 75,
  radius: 15,
  damage: 8,
  xp: 3,
  weight: 3,
  fromLevel: 4,
  look: { shape: 'diamond', color: PALETTE.purple, face: { mood: 'angry', mouth: 'o' } },
  think(ctx, m, dt) {
    const t = m.target;
    if (!t) {
      m.vx = 0;
      m.vy = 0;
      return;
    }
    const d = v.dist(m, t);
    const toward = v.angleTo(m, t);
    m.angle = toward;
    // Closer when far, back off when near, circle in between.
    const move = d > 340 ? toward : d < 260 ? toward + Math.PI : toward + Math.PI / 2;
    m.vx = Math.cos(move) * m.speed;
    m.vy = Math.sin(move) * m.speed;
    m.mem.cooldown = (m.mem.cooldown ?? 1 + ctx.rng.next()) - dt;
    if (m.mem.cooldown <= 0 && d < 520) {
      m.mem.cooldown = 2.4;
      ctx.fire(m, 'spit', { angle: toward, speed: 260, damage: 10 });
    }
  },
};
