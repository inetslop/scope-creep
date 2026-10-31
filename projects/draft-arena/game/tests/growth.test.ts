import { describe, expect, it } from 'vitest';
import type { Ctx, Player } from '../engine/api.ts';
import { growth } from '../src/content/directors/growth.ts';

/** A player with just what growth reads: the level and the current radius. */
const player = (level: number, radius: number): Player => ({ type: 'player', level, radius } as unknown as Player);

/** Runs one growth tick on a single player and returns the radius it landed on. */
const run = (p: Player, dt: number): number => {
  const ctx = { players: () => [p] } as unknown as Ctx;
  growth.tick!(ctx, {}, dt);
  return p.radius;
};

const TOP = 18 * (33 / 17); // level 17: 18 * (1 + 16/17) ≈ 34.94

describe('growth', () => {
  it('a level 1 player stays at the base radius', () => {
    expect(run(player(1, 18), 0.5)).toBe(18);
  });

  it('a level 17 player is almost twice as wide as a level 1 one', () => {
    expect(run(player(17, 18), 0.5)).toBeCloseTo(TOP);
  });

  it('a knockout back to level 1 shrinks the player to the base radius', () => {
    expect(run(player(1, 36), 0.5)).toBe(18);
  });

  it('a short tick moves the radius a little toward the target, never popping', () => {
    // f = min(1, dt / 0.5) = (1/30) / 0.5 = 1/15 of the way
    expect(run(player(17, 18), 1 / 30)).toBeCloseTo(18 + (TOP - 18) / 15);
  });

  it('an abnormally long tick lands exactly on the target, never past it', () => {
    expect(run(player(17, 18), 1)).toBeCloseTo(TOP);
  });
});
