/** Global tuning constants that are not content (content lives in src/content). */

/** The arena is a square of this size (world units), centered at (0, 0). */
export const ARENA_SIZE = 3200;

/** World units visible across the SHORT side of the screen. Camera zoom is derived from it. */
export const VIEW_SHORT_SIDE = 640;

export const PLAYER_RADIUS = 16;

/** Invulnerability after the player is hit, in ms. */
export const PLAYER_INVULN_MS = 650;

/** Tuning for elite enemies: one of a random unlocked type, on a fixed timer. */
export const ELITE = {
  intervalSec: 45, scale: 1.8, hpMul: 5, contactDamageMul: 1.5,
  knockbackResistBonus: 0.5, xpMul: 6, shardCount: 6, shardSpread: 26, extraDeathRings: 2,
} as const;

/** Draw order. Higher is on top. */
export const DEPTH = {
  floor: 0,
  arena: 5,
  pickups: 10,
  bubble: 15,
  enemies: 20,
  projectiles: 30,
  playerBarrel: 39,
  player: 40,
  fx: 50,
} as const;
