/**
 * What the leaderboard accepts: pure, no storage, so the tests cover it without a database.
 * A run is sent as its wave count, kills and seed (the score is computed here, never sent), with
 * a 4-letter name, and the level it was played at with that level's score multiplier.
 */

/** Four capital letters, arcade style. */
export const NAME_RE = /^[A-Z]{4}$/;

/** Names refused on a public page. Short on purpose: the obvious ones only. */
export const BLOCKED = new Set(['ANAL', 'ANUS', 'ARSE', 'CLIT', 'COCK', 'CUNT', 'DICK', 'DYKE', 'FUCK', 'FUKK', 'GOOK', 'HOMO', 'JIZZ', 'KIKE', 'NAZI', 'PISS', 'PORN', 'SHIT', 'SLUT', 'SPIC', 'TITS', 'TWAT', 'WANK']);

export const MAX_WAVES = 1000;

/** A generous ceiling on kills for a run that held `waves` waves (each wave sends more than the last). */
export const maxKills = (waves: number): number => 40 * (waves + 1) ** 2;

/** The run's score, as the game computes it (RunState.finalScore): waves held, then kills, times the level's multiplier. */
export const scoreOf = (waves: number, kills: number, mul = 1): number => Math.floor((waves * 100 + kills) * mul);

/** The highest level taken: the number of level augments on in the run (the game has 5; room to grow). */
export const MAX_LEVEL = 10;

/** A generous ceiling on a level's multiplier: no level augment adds more than this to it. */
export const MUL_PER_LEVEL = 0.5;

export interface Run {
  name: string;
  waves: number;
  kills: number;
  seed: number;
  /** The level the run was played at: 0 with no level augments, and for games that don't send it. */
  level: number;
  /** The level's score multiplier (1 at level 0). */
  mul: number;
  score: number;
}

export type Checked = { ok: true; run: Run } | { ok: false; error: string };

const isInt = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

/** Checks a submitted run: the name, and whole, sane numbers. */
export function checkSubmission(body: unknown): Checked {
  if (!body || typeof body !== 'object') return { ok: false, error: 'bad body' };
  const b = body as Record<string, unknown>;
  const name = typeof b.name === 'string' ? b.name.toUpperCase() : '';
  if (!NAME_RE.test(name) || BLOCKED.has(name)) return { ok: false, error: 'name' };
  if (!isInt(b.waves, 0, MAX_WAVES)) return { ok: false, error: 'waves' };
  if (!isInt(b.kills, 0, maxKills(b.waves))) return { ok: false, error: 'kills' };
  if (!isInt(b.seed, 0, 2 ** 31 - 1)) return { ok: false, error: 'seed' };
  // A game that sends no level (older builds) posts at level 0, its multiplier ignored.
  const level = b.level === undefined ? 0 : b.level;
  if (!isInt(level, 0, MAX_LEVEL)) return { ok: false, error: 'level' };
  const mul = b.level === undefined ? 1 : b.mul;
  if (typeof mul !== 'number' || !Number.isFinite(mul) || mul < 1 || mul > 1 + MUL_PER_LEVEL * level) return { ok: false, error: 'mul' };
  return { ok: true, run: { name, waves: b.waves, kills: b.kills, seed: b.seed, level, mul, score: scoreOf(b.waves, b.kills, mul) } };
}
