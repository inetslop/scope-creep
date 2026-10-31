import { chase, drawCritter, traceShape, v, type Look, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

const CREEP = 1.6;
const WIND_UP = 0.45;
const LUNGE = 0.45;

const body: Look = { shape: 'triangle', color: PALETTE.orange };

/**
 * Creeps in at half speed, stops with a spinning star over its head as a warning (slot 0), then
 * lunges. The example of a custom think, mem for state, a slot the clients draw, and a look that
 * draws the standard critter and adds to it.
 */
export const dart: MonsterDef = {
  id: 'dart',
  name: 'Dart',
  description: 'Creeps closer, stops with a spinning star over its head, then lunges at three times its speed.',
  hp: 8,
  speed: 110,
  radius: 12,
  damage: 10,
  xp: 2,
  weight: 5,
  fromLevel: 3,
  look: {
    ...body,
    draw(g, e) {
      const winding = e.slots[0] === 1;
      drawCritter(g, body, e, { ink: PALETTE.ink, face: { mood: winding ? 'scared' : 'angry', mouth: winding ? 'teeth' : 'none' } });
      if (!winding) return;
      g.save();
      g.translate(0, -e.radius * 1.9);
      g.beginPath();
      traceShape(g, 'star', e.radius * 0.55, e.time * 6);
      g.fillStyle = PALETTE.yellow;
      g.fill();
      g.lineWidth = 2;
      g.lineJoin = 'round';
      g.strokeStyle = PALETTE.ink;
      g.stroke();
      g.restore();
    },
  },
  think(_ctx, m, dt) {
    m.mem.timer = (m.mem.timer ?? CREEP) - dt;
    const phase = m.mem.phase ?? 0;
    if (m.mem.timer <= 0) {
      m.mem.phase = (phase + 1) % 3;
      m.mem.timer = [CREEP, WIND_UP, LUNGE][m.mem.phase]!;
      if (m.mem.phase === 2 && m.target) m.angle = v.angleTo(m, m.target);
    }
    m.slots[0] = m.mem.phase === 1 ? 1 : 0;
    if (m.mem.phase === 0) {
      chase(m);
      m.vx *= 0.5;
      m.vy *= 0.5;
    } else if (m.mem.phase === 1) {
      m.vx = 0;
      m.vy = 0;
      if (m.target) m.angle = v.angleTo(m, m.target);
    } else {
      m.vx = Math.cos(m.angle) * m.speed * 3;
      m.vy = Math.sin(m.angle) * m.speed * 3;
    }
  },
};
