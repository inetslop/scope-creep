/** Global tuning constants that are not content (content lives in src/content). */

/** Size of one board cell in board units. Everything on the board is measured in these. */
export const CELL = 64;

/** Board size in cells along its long and short side. Landscape screens get 14x8, portrait 8x14. */
export const GRID = { long: 14, short: 8 } as const;

/** Rocks (blocked cells) scattered on each new map. */
export const ROCKS = 5;

/** A new run starts with this: gold, lives, and the augments in hand (the opening draft adds the first). */
export const START = { gold: 100, lives: 20, hand: [] as readonly string[] } as const;

/**
 * Gold to unlock each slot of one tower: the first is building the tower, every further one on the
 * same tower costs a lot more. A tower has at most MAX_SLOTS.
 */
export const SLOT_COSTS = [40, 70, 160, 400] as const;
export const MAX_SLOTS = SLOT_COSTS.length;

/** Seconds of build time before a wave starts on its own ("Next wave" starts it early). */
export const BUILD_SEC = { first: 8, between: 10 } as const;

/** Gold for clearing a wave: base + per wave number. */
export const WAVE_BONUS = { base: 20, perWave: 2 } as const;

/** Screen pixels the HUD cards take at the top and bottom; the board fits between them. */
export const HUD = { top: 72, bottom: 116, margin: 10 } as const;

/** How far the player can zoom the board, as multiples of the zoom that fits it all. */
export const ZOOM = { min: 1, max: 2.4, step: 1.3 } as const;

/** A press that moves less than this many screen pixels is a tap (builds); more is a drag (pans). */
export const TAP_SLOP = 10;

/** Draw order on the board. Higher is on top. */
export const DEPTH = {
  board: 0,
  preview: 5,
  towers: 10,
  enemies: 20,
  projectiles: 30,
  bars: 35,
  fx: 40,
} as const;
