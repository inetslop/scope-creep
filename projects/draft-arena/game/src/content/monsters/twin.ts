import { chase, drawCritter, drawFace, type Face, type Look, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

const SHUDDER = 0.4;
const BIRTH_OFFSET = 20;

const CALM: Face = { mood: 'calm', eyes: 2, mouth: 'smile' };
const SHUDDER_F: Face = { mood: 'scared', eyes: 2, mouth: 'o' };

const look: Look = { shape: 'circle', color: PALETTE.berry, face: CALM };
look.draw = (g, e) => {
  const shudder = e.slots[0] === 1;
  const face = shudder ? SHUDDER_F : CALM;
  const r = e.radius;
  g.save();
  if (shudder) { // the shudder: a small shake around the centre, driven by e.time so every client sees it
    const j = r * 0.12;
    g.translate(Math.sin(e.time * 30 + e.seed * 3) * j, Math.cos(e.time * 26 + e.seed) * j * 0.5);
  }
  g.save();
  g.scale(0.84, 1.1); // bean: a tall oval, inside the 0.8..1.2 squash
  drawCritter(g, look, e, { ink: PALETTE.ink }); // no face: the face keeps its shape
  g.restore();
  g.beginPath();
  g.arc(0, -1.14 * r, 0.34 * r, 0.59, 2.55); // the notch: a short dip across the top, both ends inside the body
  g.strokeStyle = PALETTE.ink;
  g.lineWidth = Math.max(1.5, Math.min(3, r * 0.2));
  g.stroke();
  drawFace(g, face, r, e.angle, PALETTE.ink);
  g.restore();
};

/** The kill that doesn't kill: at half hp it shudders, births one twinling, and keeps living. */
export const twin: MonsterDef = {
  id: 'twin',
  name: 'Twin',
  description: 'At half hp it shudders, births a twinling, and keeps living.',
  hp: 40,
  speed: 70,
  radius: 16,
  damage: 10,
  xp: 3,
  weight: 4,
  fromLevel: 4,
  look,
  think(ctx, m, dt) {
    const mem = m.mem;
    if (mem.ss === 1) { // shuddering: stopped and shaking
      m.vx = 0;
      m.vy = 0;
      const left = (mem.tt ?? 0) - dt;
      if (left <= 0) { // still alive after 0.4 s: give birth once, off the line to its target
        const t = m.target;
        const a = t ? Math.atan2(t.y - m.y, t.x - m.x) : ctx.rng.range(0, Math.PI * 2);
        const side = ctx.rng.chance(0.5) ? Math.PI / 2 : -Math.PI / 2;
        const x = m.x + Math.cos(a + side) * BIRTH_OFFSET;
        const y = m.y + Math.sin(a + side) * BIRTH_OFFSET;
        ctx.spawnMonster('twinling', x, y);
        ctx.effect('pop', { x, y }, undefined, 10);
        mem.born = 1;
        mem.ss = 0;
        m.slots[0] = 0;
        return;
      }
      mem.tt = left;
      m.slots[0] = 1;
      return;
    }
    if (!mem.born && m.hp <= m.maxHp / 2) { // first dip to half: the shudder
      mem.ss = 1;
      mem.tt = SHUDDER;
      m.vx = 0;
      m.vy = 0;
      m.slots[0] = 1;
      return;
    }
    m.slots[0] = 0;
    chase(m);
  },
};
