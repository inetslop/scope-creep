import type { DirectorDef } from '../../../engine/api.ts';

const PAY = 25;

/**
 * The Nth prestige this life pays 25 x N coins for the shop; the reset gives no power back. Bots get none.
 * The pay goes out one tick later as a coin pickup at the player's feet: they are standing on it, so it
 * collects at once, while a player who dies in the meantime gets nothing (their life is over anyway).
 */
export const prestigeCoins: DirectorDef = {
  id: 'prestige-coins',
  name: 'Prestige pays',
  description: 'Each prestige this life pays 25 coins times its number: 25, 50, 75, and on.',
  onPrestige(_ctx, mem, player, count) {
    const key = `pay${player.id}`;
    mem[key] = (mem[key] ?? 0) + PAY * count; // count includes this prestige
  },
  tick(ctx, mem) {
    for (const key of Object.keys(mem)) {
      const amount = mem[key]!;
      const p = ctx.playerById(Number(key.slice(3)));
      delete mem[key];
      if (p) ctx.dropPickup('coin', p.x, p.y, amount);
    }
  },
};
