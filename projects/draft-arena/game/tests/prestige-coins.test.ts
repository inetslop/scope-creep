import { describe, expect, it } from 'vitest';
import type { Ctx, Player } from '../engine/api.ts';
import { prestigeCoins } from '../src/content/directors/prestige-coins.ts';
import { coin } from '../src/content/pickups/coin.ts';

/** A player with just what prestige-coins reads: the id and the spot it stands at. */
const player = (id: number): Player => ({ type: 'player', id, x: 100, y: 200 } as unknown as Player);

/** Prestiges at `count`, then runs one tick: records the coin pickup dropped (and what mem kept). */
const run = (id: number, count: number, alive: boolean): { drops: { id: string; x: number; y: number; value: number }[]; mem: Record<string, number> } => {
  const mem: Record<string, number> = {};
  const drops: { id: string; x: number; y: number; value: number }[] = [];
  const p = player(id);
  const ctx = {
    playerById: (n: number) => (alive && n === id ? p : undefined),
    dropPickup: (pickupId: string, x: number, y: number, value: number): void => {
      drops.push({ id: pickupId, x, y, value });
    },
  } as unknown as Ctx;
  prestigeCoins.onPrestige!(ctx, mem, p, count);
  prestigeCoins.tick!(ctx, mem, 0.05);
  return { drops, mem };
};

describe('prestige pays', () => {
  it('the Nth prestige this life drops one coin pickup worth 25 x N', () => {
    for (const [count, pay] of [
      [1, 25],
      [2, 50],
      [3, 75],
      [9, 225],
    ] as const) {
      const { drops, mem } = run(1, count, true);
      expect(drops, `prestige ${count}`).toEqual([{ id: 'coin', x: 100, y: 200, value: pay }]);
      expect(mem, 'nothing left in mem after the pay tick').toEqual({});
    }
  });

  it('two prestiges in one tick add up to one pickup', () => {
    const mem: Record<string, number> = {};
    const drops: { id: string; x: number; y: number; value: number }[] = [];
    const p = player(1);
    const ctx = {
      playerById: (n: number) => (n === 1 ? p : undefined),
      dropPickup: (pickupId: string, x: number, y: number, value: number): void => {
        drops.push({ id: pickupId, x, y, value });
      },
    } as unknown as Ctx;
    prestigeCoins.onPrestige!(ctx, mem, p, 1);
    prestigeCoins.onPrestige!(ctx, mem, p, 2);
    prestigeCoins.tick!(ctx, mem, 0.05);
    expect(drops).toEqual([{ id: 'coin', x: 100, y: 200, value: 75 }]);
  });

  it('a player who is gone by the pay tick gets no pickup, and mem stays clean', () => {
    const { drops, mem } = run(1, 3, false);
    expect(drops).toEqual([]);
    expect(mem).toEqual({});
  });
});

describe('the coin pickup', () => {
  it('pays its value as coins when collected', () => {
    const coins: number[] = [];
    const ctx = {
      giveCoins: (_p: Player, n: number): void => {
        coins.push(n);
      },
    } as unknown as Ctx;
    coin.collect(ctx, player(1), 75);
    expect(coins).toEqual([75]);
  });
});
