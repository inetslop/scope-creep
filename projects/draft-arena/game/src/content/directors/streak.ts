import type { DirectorDef } from '../../../engine/api.ts';

const WINDOW = 20; // s between counted knockouts that keep the chain alive
const SASH = 15; // s the sash shows, refreshed by every counted knockout
const BONUS = 1; // coins per kill while the sash shows (humans only, like Kill coins)
const BONUS2 = 2; // coins per kill while the sash is green, from a third knockout in the chain

/**
 * The streak: two player knockouts within 20 s put a sash on the killer for 15 s, refreshed
 * by every further knockout within 20 s; while it shows, every kill pays +1 coin (humans only).
 * A third knockout in the chain turns the sash green (statuses/streak-green.ts) and the pay to
 * +2; a fourth and further stay green and pay no more. Knocked out or prestiging breaks the
 * chain and removes the sash. The tier is read from the chain's count on every refresh, so a
 * broken chain that restarts comes back golden. The sash is a status (statuses/streak-gold.ts
 * and streak-green.ts), so it rides on the body and is kept on every tick, like the prestige
 * stars.
 */
export const streak: DirectorDef = {
  id: 'streak',
  name: 'The streak',
  description: 'Two player knockouts within 20 s wear a sash for 15 s, golden at two, green from a third; every kill while it shows pays +1 coin, +2 while it is green.',
  tick(ctx, mem) {
    for (const p of ctx.players()) if ((mem[`s${p.id}`] ?? 0) > ctx.time) ctx.addStatus(p, (mem[`c${p.id}`] ?? 0) >= 3 ? 'streak-green' : 'streak-gold', 0.2);
  },
  onKill(ctx, mem, killer, victim) {
    const t = ctx.time;
    const sash = killer && (mem[`s${killer.id}`] ?? 0) > t; // showing before this kill: it pays
    if (victim.type === 'player') {
      mem[`c${victim.id}`] = 0;
      mem[`w${victim.id}`] = 0;
      mem[`s${victim.id}`] = 0;
    }
    if (!killer) return;
    const chain = mem[`c${killer.id}`] ?? 0;
    const n = victim.type === 'player' ? (chain > 0 && t - (mem[`w${killer.id}`] ?? 0) <= WINDOW ? chain + 1 : 1) : chain;
    if (victim.type === 'player') {
      mem[`c${killer.id}`] = n;
      mem[`w${killer.id}`] = t;
      if (n >= 2) mem[`s${killer.id}`] = t + SASH;
    }
    if (sash && !killer.bot) ctx.giveCoins(killer, n >= 3 ? BONUS2 : BONUS);
  },
  onPrestige(_ctx, mem, player) {
    mem[`c${player.id}`] = 0;
    mem[`w${player.id}`] = 0;
    mem[`s${player.id}`] = 0;
  },
};
