/**
 * Writes one player's snapshot: their own state, every entity within INTEREST_RADIUS, and this
 * tick's events (path projectile launches and removals, effects) within EVENT_RADIUS. Sending only
 * what is near is what keeps 60 players affordable: the bytes per player stay flat as the match grows.
 */
import { EVENT_RADIUS, INTEREST_RADIUS } from '../config.ts';
import type { Writer } from '../shared/codec.ts';
import { writeEffect, writeEntity, writeLaunch, writeSnapshotHead } from '../shared/protocol.ts';
import type { SimPlayer, SimVisible } from './entities.ts';
import type { Match } from './match.ts';

const NO_STATUSES: number[] = [];
const statusScratch: number[] = [];

function writeVisible(w: Writer, m: Match, e: SimVisible): void {
  switch (e.cat) {
    case 'player':
    case 'monster': {
      statusScratch.length = 0;
      for (const s of e.statuses) statusScratch.push(s.index);
      writeEntity(w, e.id, e.kind, e.x, e.y, e.angle, e.radius, e.cat === 'player' ? m.rules.player.radius : e.def.radius, e.hp / e.maxHp, e.flashUntil >= m.tick, e.slots, statusScratch);
      return;
    }
    case 'projectile':
      writeEntity(w, e.id, e.kind, e.x, e.y, e.angle, e.radius, e.def.radius, 1, false, e.slots, NO_STATUSES);
      return;
    case 'area':
      // hp carries the life left, so clients can fade an area out.
      writeEntity(w, e.id, e.kind, e.x, e.y, e.angle, e.radius, e.def.radius, 1 - e.age / e.life, false, e.slots, NO_STATUSES);
      return;
    case 'pickup':
      writeEntity(w, e.id, e.kind, e.x, e.y, e.angle, e.radius, e.def.radius, 1, false, e.slots, NO_STATUSES);
      return;
  }
}

export function writeSnapshot(w: Writer, m: Match, p: SimPlayer): void {
  const reg = m.registry;
  writeSnapshotHead(w, m.tick, {
    alive: p.alive,
    ackSeq: p.ackSeq,
    x: p.x,
    y: p.y,
    hp: p.hp,
    maxHp: p.maxHp,
    level: p.level,
    xp: p.xp,
    xpNext: p.xpNext,
    speed: p.stats.speed * m.speedMul(p),
    kills: p.kills,
    score: p.score,
    respawnIn: p.alive ? 0 : Math.max(0, p.respawnAt - m.time),
    pendingPicks: p.pendingPicks,
    talents: [...p.talents].map(([t, rank]) => ({ index: reg.talentIndex.get(t)!, rank })),
    upgrades: [...p.upgrades].map(([d, held]) => ({ index: reg.upgradeIndex.get(d)!, level: held.level })),
  });

  const r2 = INTEREST_RADIUS * INTEREST_RADIUS;
  const countAt = w.pos;
  w.u16(0);
  let n = 0;
  m.visible.each(p.x, p.y, INTEREST_RADIUS, (e) => {
    if (e.dead || (e.x - p.x) ** 2 + (e.y - p.y) ** 2 > r2) return;
    writeVisible(w, m, e);
    n++;
    return n >= 0xffff;
  });
  w.setU16(countAt, n);

  const e2 = EVENT_RADIUS * EVENT_RADIUS;
  const near = (x: number, y: number): boolean => (x - p.x) ** 2 + (y - p.y) ** 2 <= e2;

  const launchesAt = w.pos;
  w.u16(0);
  n = 0;
  for (const l of m.events.launches) {
    if (!near(l.launch.x, l.launch.y)) continue;
    writeLaunch(w, { id: l.id, kind: l.kind, x: l.launch.x, y: l.launch.y, angle: l.launch.angle, speed: l.launch.speed, owner: l.owner.id, tick: l.born, life: l.life, seed: l.launch.seed, p1: l.launch.p1, p2: l.launch.p2 });
    n++;
  }
  w.setU16(launchesAt, n);

  const removesAt = w.pos;
  w.u16(0);
  n = 0;
  for (const r of m.events.removes) {
    if (!near(r.x, r.y)) continue;
    w.u16(r.id);
    n++;
  }
  w.setU16(removesAt, n);

  const effectsAt = w.pos;
  w.u16(0);
  n = 0;
  for (const fx of m.events.effects) {
    if (!near(fx.ax, fx.ay)) continue;
    writeEffect(w, fx);
    n++;
  }
  w.setU16(effectsAt, n);
}
