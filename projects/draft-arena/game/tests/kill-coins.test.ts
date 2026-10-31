import { describe, expect, it } from 'vitest';
import type { Ctx, EffectView, Monster, Player, Point, Unit } from '../engine/api.ts';
import { killCoins } from '../src/content/directors/kill-coins.ts';
import { coin } from '../src/content/effects/coin.ts';

/** Units with just what kill-coins reads: the kind, the bot flag, the level and the death spot. */
const player = (bot: boolean, level: number): Player => ({ type: 'player', bot, level, x: 100, y: 200 } as unknown as Player);
const monster = (): Monster => ({ type: 'monster', x: 100, y: 200 } as unknown as Monster);

/** Runs the director's onKill against a stub ctx and records what it credited and played. */
const run = (killer: Player | undefined, victim: Unit): { coins: number[]; effects: { id: string; x: number; y: number; value: number }[] } => {
  const coins: number[] = [];
  const effects: { id: string; x: number; y: number; value: number }[] = [];
  const ctx = {
    giveCoins: (_p: Player, n: number): void => {
      coins.push(n);
    },
    effect: (id: string, a: Point, _b?: Point, value = 0): void => {
      effects.push({ id, x: a.x, y: a.y, value });
    },
  } as unknown as Ctx;
  killCoins.onKill!(ctx, {}, killer, victim);
  return { coins, effects };
};

describe('kill coins', () => {
  it('a monster kill pays one coin, with one coin effect at the death spot', () => {
    const { coins, effects } = run(player(false, 1), monster());
    expect(coins).toEqual([1]);
    expect(effects).toEqual([{ id: 'coin', x: 100, y: 200, value: 1 }]);
  });

  it("a knockout pays the victim's level; a bot pays nothing", () => {
    expect(run(player(false, 1), player(false, 8)).coins).toEqual([8]);
    expect(run(player(false, 1), player(true, 8)).coins).toEqual([]);
  });

  it('a bot killer never earns, and a death with no killer pays nothing', () => {
    expect(run(player(true, 1), monster()).coins).toEqual([]);
    expect(run(undefined, monster()).coins).toEqual([]);
  });

  it('a knockout throws one coin effect for the whole fountain, not one per coin', () => {
    const { coins, effects } = run(player(false, 1), player(false, 10));
    expect(coins).toEqual([10]);
    expect(effects).toEqual([{ id: 'coin', x: 100, y: 200, value: 10 }]);
  });
});

/** A canvas stand-in that counts the circles coin.draw() asks for (2 per coin: body + shine). */
const countingCanvas = (): { canvas: CanvasRenderingContext2D; arcs: number } => {
  let arcs = 0;
  const canvas = {
    beginPath(): void {},
    arc(_x: number, _y: number, _r: number, _a0: number, _a1: number): void {
      arcs++;
    },
    fill(): void {},
    stroke(): void {},
    globalAlpha: 1,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
  } as unknown as CanvasRenderingContext2D;
  return { canvas, get arcs() { return arcs; } };
};

const fx = (age: number, value: number): EffectView => ({ ax: 100, ay: 100, bx: 100, by: 100, value, t: age / coin.duration, age, seed: 3 });

const drawAt = (age: number, value: number): { arcs: number; alpha: number } => {
  const c = countingCanvas();
  coin.draw(c.canvas, fx(age, value));
  return { arcs: c.arcs, alpha: c.canvas.globalAlpha };
};

describe('the coin effect', () => {
  it('a kill throws one coin that pops, rises for 0.6 s and is gone', () => {
    expect(drawAt(0, 1).arcs).toBe(0);
    expect(drawAt(0.3, 1).arcs).toBe(2);
    expect(drawAt(0.7, 1).arcs).toBe(0);
  });

  it('a knockout throws one coin per coin paid, 0.05 s apart', () => {
    expect(drawAt(0.25, 10).arcs).toBe(10);
    expect(drawAt(0.5, 10).arcs).toBe(20);
    expect(drawAt(1.15, 10).arcs).toBe(0);
  });

  it('clamps the fountain at 20 coins, done within its 1.6 s duration', () => {
    expect(drawAt(1.5, 50).arcs).toBe(2);
    expect(drawAt(1.6, 50).arcs).toBe(0);
  });

  it('restores the canvas alpha it faded with', () => {
    expect(drawAt(0.5, 10).alpha).toBe(1);
  });
});
