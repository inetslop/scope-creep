import type { DirectorDef } from '../../../engine/api.ts';

const FIRST = 60;
const EVERY = 90;
const COUNT = 12;
const GAP = 30;
const SPAN = (COUNT - 1) * GAP;
/** Longest a Dot keeps marching: far corner of the edge to the centre at its speed. */
const MARCH_MAX = 40;

/** Every 90 s (first at 60 s), a line of twelve Dots walks in a single file from an edge toward the centre. */
export const swarmSurge: DirectorDef = {
  id: 'swarm-surge',
  name: 'Swarm surge',
  description: 'A line of twelve Dots walks from an edge toward the centre.',
  tick(ctx, mem) {
    if (ctx.time < (mem.next ?? FIRST)) return;
    mem.next = ctx.time + EVERY;
    const players = ctx.players();
    if (players.length === 0) return;
    // At most 24 surge Dots: a surge's Dots stop marching within MARCH_MAX of spawning, and
    // surges come every 90 s, so this only guards a march running long.
    const marching =
      (ctx.time - (mem.s0 ?? -1e9) < MARCH_MAX ? COUNT : 0) +
      (ctx.time - (mem.s1 ?? -1e9) < MARCH_MAX ? COUNT : 0);
    if (marching + COUNT > 24) return;
    mem.s1 = mem.s0 ?? -1e9;
    mem.s0 = ctx.time;
    // The edge nearest a player, line centred on that player: it starts in sight of the fight.
    const { width, height } = ctx.rules.world;
    let best = Infinity, edge = 0, at = width / 2;
    for (const p of players) {
      if (p.x < best) { best = p.x; edge = 0; at = p.y; }
      if (p.y < best) { best = p.y; edge = 1; at = p.x; }
      if (width - p.x < best) { best = width - p.x; edge = 2; at = p.y; }
      if (height - p.y < best) { best = height - p.y; edge = 3; at = p.x; }
    }
    const long = edge === 0 || edge === 2 ? width : height;
    const a0 = Math.min(Math.max(at - SPAN / 2, 30), long - 30 - SPAN);
    for (let i = 0; i < COUNT; i++) {
      const along = a0 + i * GAP;
      const x = edge === 0 ? 30 : edge === 2 ? width - 30 : along;
      const y = edge === 1 ? 30 : edge === 3 ? height - 30 : along;
      const m = ctx.spawnMonster('dot', x, y);
      if (!m) continue;
      m.mem.surge = 1;
      m.slots[1] = 1;
    }
  },
};
