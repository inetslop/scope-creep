import type { DirectorDef } from '../../../engine/api.ts';

const FIRST = 60; // the first mark
const EVERY = 90; // then a new mark every 90 s
const DURATION = 15;
const RING = 26; // the ring's radius, and the pop/burst size
const BONUS_XP = 20;
const BONUS_COINS = 5;
const ESCAPE_COINS = 5;

/**
 * The mark: a random living player (human or bot, never the same one twice in a row when two or
 * more are alive) is marked for 15 s - a red target ring (areas/mark.ts) and +35% speed
 * (statuses/marked.ts). A player knockout pays 20 xp and 5 coins on top of the normal bounty,
 * with a burst where the ring was; a monster kill pops the ring into confetti and pays nothing;
 * an expired mark banks 5 coins for the marked player if they are still alive (humans only),
 * as the existing coin pickup at their feet. It adds no monsters.
 */
export const mark: DirectorDef = {
  id: 'mark',
  name: 'The mark',
  description: 'Every 90 s, a random player is marked for 15 s: +35% speed, and a bonus for who knocks them out.',
  tick(ctx, mem) {
    if (mem.until && ctx.time < mem.until) {
      const target = ctx.playerById(mem.mark);
      if (target) ctx.area(target, 'mark');
      return;
    }
    if (mem.until) {
      const gone = ctx.playerById(mem.mark); // expired: they are still alive (a kill clears mem first)
      mem.mark = 0;
      mem.until = 0;
      if (gone) {
        ctx.effect('pop', spot(gone), undefined, RING);
        if (!gone.bot) ctx.dropPickup('coin', gone.x, gone.y, ESCAPE_COINS);
      }
    }
    if (ctx.time < (mem.next ?? FIRST)) return;
    mem.next = ctx.time + EVERY;
    const players = ctx.players();
    if (players.length === 0) return;
    const last = mem.last;
    const pool = players.length > 1 && last ? players.filter((p) => p.id !== last) : players;
    const p = ctx.rng.pick(pool);
    mem.mark = p.id;
    mem.last = p.id;
    mem.until = ctx.time + DURATION;
    ctx.addStatus(p, 'marked', DURATION);
    ctx.effect('pop', spot(p), undefined, 20);
  },
  onKill(ctx, mem, killer, victim) {
    if (victim.type !== 'player' || !mem.mark || victim.id !== mem.mark) return;
    mem.mark = 0;
    mem.until = 0;
    if (killer) {
      ctx.giveXp(killer, BONUS_XP);
      ctx.giveCoins(killer, BONUS_COINS);
      ctx.effect('burst', spot(victim), undefined, RING);
    } else {
      ctx.effect('pop', spot(victim), undefined, RING);
    }
  },
};

/** The ring's spot: 12 units above the head (the top of the body is at y = -radius). */
function spot(u: { x: number; y: number; radius: number }) {
  return { x: u.x, y: u.y - (u.radius + 12) };
}
