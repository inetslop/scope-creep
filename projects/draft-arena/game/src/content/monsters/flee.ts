import { drawCritter, type Face, type Look, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Wanders in short hops; within 300 of a player it notices, then sprints directly away. */
const WANDER_SPEED = 80;
const PANIC_SPEED = 160;
const PANIC = 300;
const REALIZE = 0.18;
const WANDER_EVERY = 1.2;
const PANIC_EVERY = 0.3;
const WOBBLE = 25 * Math.PI / 180;

const CALM: Face = { mood: 'calm', eyes: 2, mouth: 'o' };
const PANIC_F: Face = { mood: 'scared', eyes: 2, mouth: 'o' };

const look: Look = { shape: 'circle', color: PALETTE.red, face: CALM };
look.draw = (g, e) => {
  const scared = e.slots[0] === 1;
  g.save();
  if (scared) {
    const j = e.radius * 0.15;
    g.translate(Math.sin(e.time * 24 + e.seed * 3.1) * j, Math.cos(e.time * 31 + e.seed) * j);
  }
  drawCritter(g, look, e, { ink: PALETTE.ink, face: scared ? PANIC_F : CALM });
  g.save();
  g.rotate(e.angle);
  g.beginPath();
  g.moveTo(0.6 * e.radius, -0.55 * e.radius);
  g.lineTo(1.7 * e.radius, 0);
  g.lineTo(0.6 * e.radius, 0.55 * e.radius);
  g.closePath();
  g.fillStyle = look.color;
  g.fill();
  g.lineJoin = 'round';
  g.lineWidth = Math.max(1.5, Math.min(3, e.radius * 0.2));
  g.strokeStyle = PALETTE.ink;
  g.stroke();
  g.restore();
  g.restore();
};

export const flee: MonsterDef = {
  id: 'flee',
  name: 'Flee',
  description: 'Notices you, then sprints straight away from you.',
  hp: 10,
  speed: WANDER_SPEED,
  radius: 11,
  damage: 8,
  xp: 2,
  weight: 5,
  fromLevel: 3,
  look,
  think(ctx, m, dt) {
    const mem = m.mem;
    const t = m.target;
    const d = t ? Math.hypot(t.x - m.x, t.y - m.y) : Number.POSITIVE_INFINITY;
    let state = mem.fs ?? 0; // 0 wander, 1 noticing, 2 panicking
    let left = (mem.ft ?? 0) - dt;
    if (state === 1) {
      if (!t) { state = 0; left = 0; }
      else if (left <= 0) { state = 2; left = 0; }
    } else if (t && d <= PANIC && state === 0) {
      state = 1; // notice: the scared face before it bolts
      mem.fa = ctx.rng.range(0, Math.PI * 2);
      left = REALIZE;
    } else if (state === 2 && (!t || d > PANIC)) {
      state = 0; // the player is gone: calm wander again
      left = 0;
    }
    if (state !== 1 && left <= 0) {
      const base = state === 2 && t ? Math.atan2(m.y - t.y, m.x - t.x) : ctx.rng.range(0, Math.PI * 2);
      mem.fa = base + (state === 2 ? ctx.rng.range(-1, 1) * WOBBLE : 0);
      left = state === 2 ? PANIC_EVERY : WANDER_EVERY;
    }
    const a = mem.fa ?? 0;
    m.vx = Math.cos(a) * (state === 2 ? PANIC_SPEED : WANDER_SPEED);
    m.vy = Math.sin(a) * (state === 2 ? PANIC_SPEED : WANDER_SPEED);
    m.angle = a;
    mem.fs = state;
    mem.ft = left;
    m.slots[0] = state === 0 ? 0 : 1; // calm vs scared
  },
  onDeath(ctx, m) {
    ctx.effect('pop', { x: m.x, y: m.y }, undefined, m.radius);
  },
};
