/**
 * The Chokepoint leaderboard: a Cloudflare Worker over a D1 (SQLite) database. Two boards, each
 * keeping every name's best run: "today", the last 24 hours (rolling), and "forever".
 *
 *   GET  /board?b=today&me=ABCD      the top entries, the board's size, and ABCD's place
 *   GET  /board?b=forever&me=ABCD
 *   POST /submit  {name, waves, kills, seed}   records a run; answers its place on both boards
 *
 * Forever lives in `best` (one row per name) with a size counter in `boards`, so reading it costs
 * a few rows (D1's free plan counts rows read). Today is read from the run log (`runs`, kept two
 * days for the rate limit too), so it costs about one row per run of the last day.
 * See leaderboard/README.md for the setup, and migrations/ for the tables.
 */
import { checkSubmission, type Run } from './rules.ts';

/** The part of D1's API this uses (also what sqlite.ts gives over bun:sqlite). */
export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}
export interface D1Database {
  prepare(sql: string): D1Statement;
}
export interface Env {
  DB: D1Database;
  /** Comma-separated origins the game is served from. */
  ALLOWED_ORIGINS?: string;
  /** Salt for hashing addresses (the rate limit never stores one in the clear). */
  IP_SALT?: string;
}

/** Submissions one address may make per hour. */
export const RATE_PER_HOUR = 30;
/** Entries a board answers with at most. */
export const TOP_MAX = 20;
/** Today's window. */
export const TODAY_MS = 24 * 3_600_000;
/** How long the run log is kept: longer than today's window. */
const LOG_DAYS = 2;

export interface Entry {
  rank: number;
  name: string;
  score: number;
  waves: number;
}
export interface Place {
  rank: number;
  total: number;
  /** The name's best score on that board (this run's, or a better one). */
  score: number;
  /** This run is the name's best on that board. */
  best: boolean;
}

type Which = 'today' | 'forever';
type Row = { name: string; score: number; waves: number };

function cors(origin: string | null, env: Env): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean);
  if (!origin || !allowed.includes(origin)) return {};
  return { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' };
}

const json = (body: unknown, status: number, headers: Record<string, string>): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

async function hashAddress(ip: string, salt: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${ip}`));
  return [...new Uint8Array(bytes).slice(0, 12)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Ranks in order, ties sharing a rank (two at 4200 are both #3, the next is #5). */
export function rankEntries(rows: readonly Row[]): Entry[] {
  const out: Entry[] = [];
  rows.forEach((r, i) => out.push({ rank: i > 0 && rows[i - 1]!.score === r.score ? out[i - 1]!.rank : i + 1, name: r.name, score: r.score, waves: r.waves }));
  return out;
}

/** One board's queries: the top, the size, a name's best, and how many names beat a score. */
function board(db: D1Database, which: Which, nowMs: number) {
  const since = new Date(nowMs - TODAY_MS).toISOString();
  if (which === 'today') {
    // One MAX per query, nothing else aggregated: SQLite then takes `waves` from the best run's row.
    return {
      top: async (limit: number) =>
        (await db.prepare('SELECT name, MAX(score) AS score, waves FROM runs WHERE at > ? GROUP BY name ORDER BY score DESC, name ASC LIMIT ?').bind(since, limit).all<Row>()).results,
      size: async () => (await db.prepare('SELECT COUNT(DISTINCT name) AS n FROM runs WHERE at > ?').bind(since).first<{ n: number }>())?.n ?? 0,
      bestOf: async (name: string) => {
        const r = await db.prepare('SELECT MAX(score) AS score, waves FROM runs WHERE name = ? AND at > ?').bind(name, since).first<{ score: number | null; waves: number }>();
        return r && r.score !== null ? { score: r.score, waves: r.waves } : null;
      },
      above: async (score: number) =>
        (await db.prepare('SELECT COUNT(*) AS n FROM (SELECT MAX(score) AS s FROM runs WHERE at > ? GROUP BY name) WHERE s > ?').bind(since, score).first<{ n: number }>())?.n ?? 0,
    };
  }
  return {
    top: async (limit: number) => (await db.prepare("SELECT name, score, waves FROM best WHERE board = 'forever' ORDER BY score DESC, at ASC LIMIT ?").bind(limit).all<Row>()).results,
    size: async () => (await db.prepare("SELECT names FROM boards WHERE board = 'forever'").first<{ names: number }>())?.names ?? 0,
    bestOf: async (name: string) => db.prepare("SELECT score, waves FROM best WHERE board = 'forever' AND name = ?").bind(name).first<{ score: number; waves: number }>(),
    above: async (score: number) => (await db.prepare("SELECT COUNT(*) AS n FROM best WHERE board = 'forever' AND score > ?").bind(score).first<{ n: number }>())?.n ?? 0,
  };
}

/** Where `name` stands on a board, or null when it has no run there. */
async function placeOf(db: D1Database, which: Which, name: string, nowMs: number): Promise<(Entry & { total: number }) | null> {
  const b = board(db, which, nowMs);
  const mine = await b.bestOf(name);
  if (!mine) return null;
  return { rank: (await b.above(mine.score)) + 1, name, score: mine.score, waves: mine.waves, total: await b.size() };
}

/** Records the run on forever: a new name, a better run (replaces the name's best), or neither. */
async function recordForever(db: D1Database, run: Run, at: string): Promise<boolean> {
  const prev = await db.prepare("SELECT score FROM best WHERE board = 'forever' AND name = ?").bind(run.name).first<{ score: number }>();
  if (!prev) {
    await db.prepare("INSERT INTO best (board, name, score, waves, at) VALUES ('forever', ?, ?, ?, ?)").bind(run.name, run.score, run.waves, at).run();
    await db.prepare("INSERT INTO boards (board, names) VALUES ('forever', 1) ON CONFLICT (board) DO UPDATE SET names = names + 1").run();
    return true;
  }
  if (run.score <= prev.score) return false;
  await db.prepare("UPDATE best SET score = ?, waves = ?, at = ? WHERE board = 'forever' AND name = ?").bind(run.score, run.waves, at, run.name).run();
  return true;
}

async function getBoard(url: URL, env: Env, nowMs: number, headers: Record<string, string>): Promise<Response> {
  const which = url.searchParams.get('b');
  if (which !== 'today' && which !== 'forever') return json({ error: 'b' }, 400, headers);
  const limit = Math.max(1, Math.min(TOP_MAX, Number(url.searchParams.get('limit')) || 10));
  const b = board(env.DB, which, nowMs);
  const me = (url.searchParams.get('me') ?? '').toUpperCase();
  const mine = /^[A-Z]{4}$/.test(me) ? await placeOf(env.DB, which, me, nowMs) : null;
  return json(
    { board: which, total: await b.size(), entries: rankEntries(await b.top(limit)), me: mine ? { rank: mine.rank, name: mine.name, score: mine.score, waves: mine.waves } : null },
    200,
    { ...headers, 'Cache-Control': 'max-age=15' },
  );
}

async function submit(request: Request, env: Env, nowMs: number, headers: Record<string, string>): Promise<Response> {
  let body: unknown;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return json({ error: 'bad body' }, 400, headers);
  }
  const checked = checkSubmission(body);
  if (!checked.ok) return json({ error: checked.error }, 400, headers);
  const run = checked.run;
  const at = new Date(nowMs).toISOString();
  const ip = await hashAddress(request.headers.get('CF-Connecting-IP') ?? '', env.IP_SALT ?? '');
  const hourAgo = new Date(nowMs - 3_600_000).toISOString();
  const recent = (await env.DB.prepare('SELECT COUNT(*) AS n FROM runs WHERE ip = ? AND at > ?').bind(ip, hourAgo).first<{ n: number }>())?.n ?? 0;
  if (recent >= RATE_PER_HOUR) return json({ error: 'rate' }, 429, headers);
  const todayBefore = await board(env.DB, 'today', nowMs).bestOf(run.name);
  await env.DB.prepare('DELETE FROM runs WHERE at < ?').bind(new Date(nowMs - LOG_DAYS * 86_400_000).toISOString()).run();
  await env.DB.prepare('INSERT INTO runs (at, ip, name, seed, waves, kills, score) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(at, ip, run.name, run.seed, run.waves, run.kills, run.score).run();
  const foreverBest = await recordForever(env.DB, run, at);
  const place = async (which: Which, best: boolean): Promise<Place> => {
    const p = (await placeOf(env.DB, which, run.name, nowMs))!;
    return { rank: p.rank, total: p.total, score: p.score, best };
  };
  return json({ today: await place('today', !todayBefore || run.score > todayBefore.score), forever: await place('forever', foreverBest) }, 200, headers);
}

export async function handle(request: Request, env: Env, nowMs = Date.now()): Promise<Response> {
  const headers = cors(request.headers.get('Origin'), env);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  const url = new URL(request.url);
  try {
    if (request.method === 'GET' && url.pathname === '/board') return await getBoard(url, env, nowMs, headers);
    if (request.method === 'POST' && url.pathname === '/submit') return await submit(request, env, nowMs, headers);
    return json({ error: 'not found' }, 404, headers);
  } catch (err) {
    console.error(err);
    return json({ error: 'server' }, 500, headers);
  }
}

export default { fetch: (request: Request, env: Env): Promise<Response> => handle(request, env) };
