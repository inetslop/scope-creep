/**
 * What the leaderboard accepts: pure, no storage, so the tests cover it without a database.
 * A run is sent as its wave count, kills and seed (the score is computed here, never sent), with
 * a 4-letter name.
 */

/** Four capital letters, arcade style. */
export const NAME_RE = /^[A-Z]{4}$/;

/** Names refused on a public page. Short on purpose: the obvious ones only. */
export const BLOCKED = new Set(['ANAL', 'ANUS', 'ARSE', 'CLIT', 'COCK', 'CUNT', 'DICK', 'DYKE', 'FUCK', 'FUKK', 'GOOK', 'HOMO', 'JIZZ', 'KIKE', 'NAZI', 'PISS', 'PORN', 'SHIT', 'SLUT', 'SPIC', 'TITS', 'TWAT', 'WANK']);

export const MAX_WAVES = 1000;

/** A generous ceiling on kills for a run that held `waves` waves (each wave sends more than the last). */
export const maxKills = (waves: number): number => 40 * (waves + 1) ** 2;

/** The run's score, as the game computes it (RunState.score): waves held, then kills. */
export const scoreOf = (waves: number, kills: number): number => waves * 100 + kills;

export interface Run {
  name: string;
  waves: number;
  kills: number;
  seed: number;
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
  return { ok: true, run: { name, waves: b.waves, kills: b.kills, seed: b.seed, score: scoreOf(b.waves, b.kills) } };
}
