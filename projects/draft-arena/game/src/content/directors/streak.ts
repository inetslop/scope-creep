import type { DirectorDef } from '../../../engine/api.ts';

const WINDOW = 20; // s between counted knockouts that keep the chain alive
const SASH = 15; // s the sash shows, refreshed by every counted knockout
const BONUS = 1; // coins per kill while the sash shows (humans only, like Kill coins)

/**
 * The streak: two player knockouts within 20 s put a golden sash on the killer for 15 s, refreshed
 * by every further knockout within 20 s; while it shows, every kill pays +1 coin (humans only).
 * Knocked out or prestiging breaks the chain and removes the sash. The sash is a status
 * (statuses/streak-gold.ts), so it rides on the body and is kept on every tick, like the prestige
 * stars.
 */
export const streak: DirectorDef = {
  id: 'streak',
  name: 'The streak',
  description: 'Two player knockouts within 20 s wear a golden sash for 15 s; every kill while it shows pays +1 coin.',
  tick(ctx, mem) {
    for (const p of ctx.players()) if ((mem[`s${p.id}`] ?? 0) > ctx.time) ctx.addStatus(p, 'streak-gold', 0.2);
  },
  onKill(ctx, mem, killer, victim) {
    const t = ctx.time;
    if (killer && !killer.bot && (mem[`s${killer.id}`] ?? 0) > t) ctx.giveCoins(killer, BONUS);
    if (victim.type !== 'player') return;
    mem[`c${victim.id}`] = 0;
    mem[`w${victim.id}`] = 0;
    mem[`s${victim.id}`] = 0;
    if (!killer) return;
    const chain = mem[`c${killer.id}`] ?? 0;
    const n = chain > 0 && t - (mem[`w${killer.id}`] ?? 0) <= WINDOW ? chain + 1 : 1;
    mem[`c${killer.id}`] = n;
    mem[`w${killer.id}`] = t;
    if (n >= 2) mem[`s${killer.id}`] = t + SASH;
  },
  onPrestige(_ctx, mem, player) {
    mem[`c${player.id}`] = 0;
    mem[`w${player.id}`] = 0;
    mem[`s${player.id}`] = 0;
  },
};
