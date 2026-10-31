/**
 * Critter Clash's boards on the same Worker: Today (each name's best life of the last 24 hours)
 * and All time (each name's best ever). Scores come only from the game server, which knows them
 * (the match is server-authoritative): a post needs `Authorization: Bearer <CC_SUBMIT_TOKEN>`.
 *
 *   GET  /cc/board?b=today&me=Ada&limit=10    the top, the board's size, and Ada's place
 *   GET  /cc/board?b=forever&me=Ada
 *   POST /cc/submit  {name, score, kills, prestige}    one life that ended (server only)
 */
import { BLOCKED } from './rules.ts';
import type { D1Database } from './worker.ts';

export const CC_TOP_MAX = 20;
export const CC_TODAY_MS = 24 * 3_600_000;
const CC_LOG_DAYS = 2;
/** The game's names: 1 to 16 characters (engine/sim/room.ts cleanName). */
const NAME_MAX = 16;
/** The name a player gets without typing one: everyone's, so it never goes on a board. */
const DEFAULT_NAME = 'Player';
const MAX_SCORE = 10_000_000;

export interface CcLife {
  name: string;
  score: number;
  kills: number;
  prestige: number;
}
export interface CcEntry {
  rank: number;
  name: string;
  score: number;
}

const isInt = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

/** A name that can go on a public board: the game's own rules, not the default, no blocked word in it. */
export function boardName(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  // eslint-disable-next-line no-control-regex
  const name = raw.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (!name || name.length > NAME_MAX || name === DEFAULT_NAME) return undefined;
  const upper = name.toUpperCase().replace(/[^A-Z]/g, '');
  for (const word of BLOCKED) if (upper.includes(word)) return undefined;
  return name;
}

export function checkLife(body: unknown): { ok: true; life: CcLife } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'bad body' };
  const b = body as Record<string, unknown>;
  const name = boardName(b.name);
  if (!name) return { ok: false, error: 'name' };
  if (!isInt(b.score, 1, MAX_SCORE)) return { ok: false, error: 'score' };
  if (!isInt(b.kills, 0, MAX_SCORE)) return { ok: false, error: 'kills' };
  if (!isInt(b.prestige, 0, 255)) return { ok: false, error: 'prestige' };
  return { ok: true, life: { name, score: b.score, kills: b.kills, prestige: b.prestige } };
}

/** Ranks in order, ties sharing a rank. */
export function rankCc(rows: readonly { name: string; score: number }[]): CcEntry[] {
  const out: CcEntry[] = [];
  rows.forEach((r, i) => out.push({ rank: i > 0 && rows[i - 1]!.score === r.score ? out[i - 1]!.rank : i + 1, name: r.name, score: r.score }));
  return out;
}

type Which = 'today' | 'forever';

function ccBoard(db: D1Database, which: Which, nowMs: number) {
  const since = new Date(nowMs - CC_TODAY_MS).toISOString();
  if (which === 'today') {
    return {
      top: async (limit: number) =>
        (await db.prepare('SELECT name, MAX(score) AS score FROM cc_runs WHERE at > ? GROUP BY name ORDER BY score DESC, name ASC LIMIT ?').bind(since, limit).all<{ name: string; score: number }>()).results,
      size: async () => (await db.prepare('SELECT COUNT(DISTINCT name) AS n FROM cc_runs WHERE at > ?').bind(since).first<{ n: number }>())?.n ?? 0,
      bestOf: async (name: string) => (await db.prepare('SELECT MAX(score) AS score FROM cc_runs WHERE name = ? AND at > ?').bind(name, since).first<{ score: number | null }>())?.score ?? null,
      above: async (score: number) =>
        (await db.prepare('SELECT COUNT(*) AS n FROM (SELECT MAX(score) AS s FROM cc_runs WHERE at > ? GROUP BY name) WHERE s > ?').bind(since, score).first<{ n: number }>())?.n ?? 0,
    };
  }
  return {
    top: async (limit: number) => (await db.prepare('SELECT name, score FROM cc_best ORDER BY score DESC, at ASC LIMIT ?').bind(limit).all<{ name: string; score: number }>()).results,
    size: async () => (await db.prepare('SELECT names FROM cc_count WHERE id = 1').first<{ names: number }>())?.names ?? 0,
    bestOf: async (name: string) => (await db.prepare('SELECT score FROM cc_best WHERE name = ?').bind(name).first<{ score: number }>())?.score ?? null,
    above: async (score: number) => (await db.prepare('SELECT COUNT(*) AS n FROM cc_best WHERE score > ?').bind(score).first<{ n: number }>())?.n ?? 0,
  };
}

export async function ccGetBoard(db: D1Database, url: URL, nowMs: number): Promise<{ status: number; body: unknown }> {
  const which = url.searchParams.get('b');
  if (which !== 'today' && which !== 'forever') return { status: 400, body: { error: 'b' } };
  const limit = Math.max(1, Math.min(CC_TOP_MAX, Number(url.searchParams.get('limit')) || 10));
  const b = ccBoard(db, which, nowMs);
  const me = boardName(url.searchParams.get('me') ?? '');
  let mine: CcEntry | null = null;
  if (me) {
    const score = await b.bestOf(me);
    if (score !== null) mine = { rank: (await b.above(score)) + 1, name: me, score };
  }
  return { status: 200, body: { board: which, total: await b.size(), entries: rankCc(await b.top(limit)), me: mine } };
}

/** Records one life: in the log (today) and as the name's best (forever) when it beats it. */
export async function ccSubmit(db: D1Database, body: unknown, nowMs: number): Promise<{ status: number; body: unknown }> {
  const checked = checkLife(body);
  if (!checked.ok) return { status: 400, body: { error: checked.error } };
  const life = checked.life;
  const at = new Date(nowMs).toISOString();
  await db.prepare('DELETE FROM cc_runs WHERE at < ?').bind(new Date(nowMs - CC_LOG_DAYS * 86_400_000).toISOString()).run();
  await db.prepare('INSERT INTO cc_runs (at, name, score, kills, prestige) VALUES (?, ?, ?, ?, ?)').bind(at, life.name, life.score, life.kills, life.prestige).run();
  const prev = await db.prepare('SELECT score FROM cc_best WHERE name = ?').bind(life.name).first<{ score: number }>();
  if (!prev) {
    await db.prepare('INSERT INTO cc_best (name, score, kills, prestige, at) VALUES (?, ?, ?, ?, ?)').bind(life.name, life.score, life.kills, life.prestige, at).run();
    await db.prepare('INSERT INTO cc_count (id, names) VALUES (1, 1) ON CONFLICT (id) DO UPDATE SET names = names + 1').run();
  } else if (life.score > prev.score) {
    await db.prepare('UPDATE cc_best SET score = ?, kills = ?, prestige = ?, at = ? WHERE name = ?').bind(life.score, life.kills, life.prestige, at, life.name).run();
  }
  return { status: 200, body: { ok: true } };
}
