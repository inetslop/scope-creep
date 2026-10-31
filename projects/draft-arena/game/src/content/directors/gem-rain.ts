import type { DirectorDef } from '../../../engine/api.ts';

const EVERY = 75;
const GEMS = 24;

/** Every 75 s, a ring of gems lands around one player: a spot worth fighting over. The example director. */
export const gemRain: DirectorDef = {
  id: 'gem-rain',
  name: 'Gem rain',
  description: 'Every 75 s, 24 gems land in a ring around a random player.',
  tick(ctx, mem) {
    if (ctx.time < (mem.next ?? EVERY)) return;
    mem.next = ctx.time + EVERY;
    const players = ctx.players();
    if (players.length === 0) return;
    const p = ctx.rng.pick(players);
    for (let i = 0; i < GEMS; i++) {
      const a = (i / GEMS) * Math.PI * 2;
      ctx.dropPickup('event-gem', p.x + Math.cos(a) * 220, p.y + Math.sin(a) * 220, 2);
    }
    ctx.effect('ring', p);
  },
};
