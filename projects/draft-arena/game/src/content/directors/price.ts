import type { DirectorDef, Player } from '../../../engine/api.ts';

const DURATION = 15; // same as the event's mark: a full 15 s window, refreshed by every kill
const RING = 26; // the pop/burst size where the target was (statuses/marked.ts)
const BONUS_XP = 20;
const BONUS_COINS = 5;

/**
 * The price: a player knockout marks the killer for 15 s - the same 'marked' status and the
 * same 'mark' ring as the event (directors/mark.ts), so it pays the same bonus. A kill while
 * marked refreshes the 15 s instead of stacking it (addStatus never stacks past one instance).
 * The two directors never pay the same knockout: a mark the event placed and a kill refreshed
 * stays the event's until its own 15 s run out (my tick runs right after the mark director's
 * in the same frame, so evUntil is its exact expiry), and if the event picks over a mark I
 * placed, the status's stacks rise past my own applications and I hand the mark to the mark
 * director, which then owns the ring and the payout.
 */
export const price: DirectorDef = {
  id: 'price',
  name: 'The price',
  description: 'Whoever knocks out a player wears the mark for 15 s; the mark pays out as usual.',
  tick(ctx, mem) {
    // My mark ran out: pop the ring where it was.
    if (mem.until && ctx.time >= mem.until) {
      const gone = ctx.playerById(mem.claim);
      mem.claim = 0;
      mem.until = 0;
      mem.apps = 0;
      if (gone) ctx.effect('pop', spot(gone), undefined, RING);
    }
    // The event's mark: a marked player who is not mine; remember it the tick it lands.
    let ev: Player | undefined;
    for (const p of ctx.players()) {
      if (p.id !== mem.claim && ctx.statusOf(p, 'marked') > 0) {
        ev = p;
        break;
      }
    }
    if (ev) {
      if (mem.evId !== ev.id) {
        mem.evId = ev.id;
        mem.evUntil = ctx.time + DURATION;
      }
    } else if (mem.evId && mem.evId !== mem.claim) {
      mem.evId = 0;
      mem.evUntil = 0;
    }
    // The event picked over my marked player: the mark director now keeps the ring and pays
    // until its own expiry (its refresh is the latest), so hand the mark to it.
    if (mem.claim) {
      const claimed = ctx.playerById(mem.claim);
      if (claimed && ctx.statusOf(claimed, 'marked') > (mem.apps ?? 0) + (mem.evId === mem.claim ? 1 : 0)) {
        mem.evId = mem.claim;
        mem.evUntil = ctx.time + DURATION;
        mem.claim = 0;
        mem.until = 0;
        mem.apps = 0;
      }
    }
  },
  onKill(ctx, mem, killer, victim) {
    // My marked player is knocked out: end my mark on them, and pay the bonus unless the
    // event's mark is the one on them (the mark director pays that one, ring burst included).
    if (victim.type === 'player' && mem.claim && mem.claim === victim.id) {
      const shared = mem.evId === victim.id && ctx.time <= mem.evUntil;
      mem.claim = 0;
      mem.until = 0;
      mem.apps = 0;
      if (!shared) {
        if (killer) {
          ctx.giveXp(killer, BONUS_XP);
          ctx.giveCoins(killer, BONUS_COINS);
          ctx.effect('burst', spot(victim), undefined, RING);
        } else {
          ctx.effect('pop', spot(victim), undefined, RING);
        }
      }
    }
    // A player knockout marks the killer (bots included); a kill while marked refreshes it.
    if (victim.type === 'player' && killer) {
      ctx.addStatus(killer, 'marked', DURATION);
      if (mem.claim === killer.id) mem.apps = (mem.apps ?? 0) + 1;
      else {
        mem.claim = killer.id;
        mem.apps = 1;
      }
      mem.until = ctx.time + DURATION;
    }
  },
};

/** Where the target is: around the player. */
function spot(u: { x: number; y: number }) {
  return { x: u.x, y: u.y };
}
