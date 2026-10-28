/**
 * URL flags, read once at startup.
 *   ?smoke      automated smoke-test mode: skips the menu, auto-picks augments, auto-resumes the
 *               pause screen, auto-restarts after game over
 *   ?play       skip the menu and start a run immediately
 *   ?debug      FPS counter
 *   ?seed=123   deterministic run seed (the map, the waves and the augment offers)
 */
const params = new URLSearchParams(window.location.search);

const seedParam = params.get('seed');
const parsedSeed = seedParam !== null ? Number.parseInt(seedParam, 10) : Number.NaN;

export const flags = {
  smoke: params.has('smoke'),
  debug: params.has('debug'),
  skipMenu: params.has('smoke') || params.has('play'),
  seed: Number.isFinite(parsedSeed) ? parsedSeed : undefined,
} as const;
