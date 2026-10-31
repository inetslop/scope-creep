import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sqliteD1 } from '../sqlite.ts';
import { CC_TODAY_MS } from '../src/critter.ts';
import { checkSubmission, maxKills } from '../src/rules.ts';
import { dayStart, handle, RATE_PER_HOUR, rankEntries, type Env } from '../src/worker.ts';

const NOW = Date.parse('2026-10-30T12:00:00Z');
const ORIGIN = 'https://inetslop.github.io';
const env = (): Env => ({ DB: sqliteD1(), ALLOWED_ORIGINS: ORIGIN, IP_SALT: 'test' });

const post = (e: Env, body: unknown, at = NOW, ip = '1.2.3.4'): Promise<Response> =>
  handle(new Request('https://lb.example/submit', { method: 'POST', body: JSON.stringify(body), headers: { Origin: ORIGIN, 'CF-Connecting-IP': ip } }), e, at);
const get = async (e: Env, query: string, at = NOW): Promise<Record<string, unknown>> =>
  (await (await handle(new Request(`https://lb.example/board?${query}`, { headers: { Origin: ORIGIN } }), e, at)).json()) as Record<string, unknown>;
const names = (b: Record<string, unknown>): string[] => (b.entries as { name: string }[]).map((x) => x.name);

describe('checkSubmission', () => {
  const ok = { name: 'abcd', waves: 12, kills: 340, seed: 77 };
  it('takes four letters (any case), sane numbers, and computes the score', () => {
    const c = checkSubmission(ok);
    assert.ok(c.ok);
    assert.deepEqual(c.run, { name: 'ABCD', waves: 12, kills: 340, seed: 77, level: 0, mul: 1, score: 1540 });
  });

  it('takes the level and its multiplier, and multiplies the score as the game does', () => {
    const c = checkSubmission({ ...ok, level: 2, mul: 1.55 });
    assert.ok(c.ok);
    assert.equal(c.run.level, 2);
    assert.equal(c.run.score, Math.floor(1540 * 1.55));
    const old = checkSubmission({ ...ok, mul: 1.25 });
    assert.ok(old.ok);
    assert.deepEqual([old.run.level, old.run.mul, old.run.score], [0, 1, 1540], 'a game that sends no level posts at level 0, its multiplier ignored');
  });

  it('refuses impossible levels and multipliers', () => {
    for (const level of [-1, 1.5, 11, '2']) assert.equal((checkSubmission({ ...ok, level, mul: 1 }) as { error: string }).error, 'level', String(level));
    for (const mul of [0.9, 2.1, Number.NaN, '1.2', undefined]) assert.equal((checkSubmission({ ...ok, level: 2, mul }) as { error: string }).error, 'mul', String(mul));
    assert.equal((checkSubmission({ ...ok, level: 0, mul: 1.25 }) as { error: string }).error, 'mul', 'level 0 is ×1');
  });

  it('refuses bad names and impossible numbers', () => {
    for (const name of ['ABC', 'ABCDE', 'AB1D', '', 'SHIT']) assert.deepEqual(checkSubmission({ ...ok, name }), { ok: false, error: 'name' }, name);
    assert.equal((checkSubmission({ ...ok, waves: 1.5 }) as { error: string }).error, 'waves');
    assert.equal((checkSubmission({ ...ok, kills: maxKills(12) + 1 }) as { error: string }).error, 'kills');
    assert.equal((checkSubmission({ ...ok, seed: -1 }) as { error: string }).error, 'seed');
  });
});

describe('rankEntries', () => {
  it('gives ties the same rank and skips the next', () => {
    const rows = [{ name: 'AAAA', score: 900, waves: 9 }, { name: 'BBBB', score: 700, waves: 7 }, { name: 'CCCC', score: 700, waves: 7 }, { name: 'DDDD', score: 500, waves: 5 }].map((r) => ({ ...r, level: 0, mul: 1 }));
    assert.deepEqual(rankEntries(rows).map((e) => e.rank), [1, 2, 2, 4]);
  });

  it('a tie needs the same level too', () => {
    const rows = [{ name: 'AAAA', score: 700, waves: 7, level: 1, mul: 1.25 }, { name: 'BBBB', score: 700, waves: 7, level: 0, mul: 1 }];
    assert.deepEqual(rankEntries(rows).map((e) => e.rank), [1, 2]);
  });
});

describe('the Worker', () => {
  it('puts a run on both boards; a name keeps only its best on each', async () => {
    const e = env();
    const first = (await (await post(e, { name: 'MATT', waves: 20, kills: 900, seed: 1 })).json()) as Record<string, unknown>;
    assert.deepEqual(first, { today: { rank: 1, total: 1, score: 2900, level: 0, best: true }, forever: { rank: 1, total: 1, score: 2900, level: 0, best: true } });
    await post(e, { name: 'ANNA', waves: 30, kills: 1500, seed: 5 });
    const worse = (await (await post(e, { name: 'MATT', waves: 3, kills: 10, seed: 9 })).json()) as Record<string, { rank: number; best: boolean; score: number }>;
    assert.deepEqual(worse.forever, { rank: 2, total: 2, score: 2900, level: 0, best: false }, 'the earlier, better run keeps its place');
    assert.deepEqual(worse.today, { rank: 2, total: 2, score: 2900, level: 0, best: false });

    const forever = await get(e, 'b=forever&me=matt');
    assert.deepEqual(forever.entries, [
      { rank: 1, name: 'ANNA', score: 4500, waves: 30, level: 0, mul: 1 },
      { rank: 2, name: 'MATT', score: 2900, waves: 20, level: 0, mul: 1 },
    ]);
    assert.equal(forever.total, 2);
    assert.deepEqual(forever.me, { rank: 2, name: 'MATT', score: 2900, waves: 20, level: 0, mul: 1 });
    const today = await get(e, 'b=today&me=MATT');
    assert.deepEqual(today.entries, forever.entries, 'each name\'s best run of the day, with its waves');
    assert.equal(today.total, 2);
  });

  it('today is the UTC day: yesterday\'s runs drop off it at 00:00 UTC, forever keeps them', async () => {
    const e = env();
    const midnight = dayStart(NOW);
    assert.equal(new Date(midnight).toISOString(), '2026-10-30T00:00:00.000Z');
    await post(e, { name: 'OLDY', waves: 50, kills: 3000, seed: 1 }, midnight - 60_000);
    await post(e, { name: 'NEWY', waves: 5, kills: 100, seed: 2 }, midnight);
    assert.deepEqual(names(await get(e, 'b=today')), ['NEWY']);
    assert.deepEqual(names(await get(e, 'b=forever')), ['OLDY', 'NEWY']);
    const later = (await (await post(e, { name: 'OLDY', waves: 2, kills: 5, seed: 3 })).json()) as Record<string, { rank: number; best: boolean; score: number }>;
    assert.deepEqual(later.today, { rank: 2, total: 2, score: 205, level: 0, best: true }, 'today counts only the run of today');
    assert.deepEqual(later.forever, { rank: 1, total: 2, score: 8000, level: 0, best: false });
  });

  it('ranks by level first, then score: level 2 at 1000 beats level 0 at 10000', async () => {
    const e = env();
    await post(e, { name: 'HIGH', waves: 99, kills: 100, seed: 1 }); // level 0, 10000
    await post(e, { name: 'LVLT', waves: 8, kills: 0, seed: 2, level: 2, mul: 1.25 }); // level 2, 1000
    await post(e, { name: 'LVLO', waves: 30, kills: 500, seed: 3, level: 1, mul: 1.25 }); // level 1, 4375
    for (const b of ['today', 'forever']) {
      const board = await get(e, `b=${b}&me=HIGH`);
      assert.deepEqual(names(board), ['LVLT', 'LVLO', 'HIGH'], b);
      assert.deepEqual((board.entries as { level: number; score: number }[]).map((x) => [x.level, x.score]), [[2, 1000], [1, 4375], [0, 10000]], b);
      assert.equal((board.me as { rank: number }).rank, 3, b);
    }
    const up = (await (await post(e, { name: 'HIGH', waves: 1, kills: 0, seed: 4, level: 3, mul: 1.5 })).json()) as Record<string, { rank: number; best: boolean; level: number }>;
    assert.deepEqual([up.forever.rank, up.forever.level, up.forever.best], [1, 3, true], 'a higher level replaces a name\'s best, even with a lower score');
    const down = (await (await post(e, { name: 'HIGH', waves: 200, kills: 0, seed: 5 })).json()) as Record<string, { best: boolean; level: number }>;
    assert.deepEqual([down.forever.best, down.forever.level, down.today.best], [false, 3, false], 'a lower level never does');
  });

  it('answers bad requests with the reason, and the allowed origin only', async () => {
    const e = env();
    const bad = await post(e, { name: 'NO', waves: 1, kills: 0, seed: 1 });
    assert.equal(bad.status, 400);
    assert.deepEqual(await bad.json(), { error: 'name' });
    assert.equal(bad.headers.get('Access-Control-Allow-Origin'), ORIGIN);
    const other = await handle(new Request('https://lb.example/board?b=forever', { headers: { Origin: 'https://evil.example' } }), e, NOW);
    assert.equal(other.headers.get('Access-Control-Allow-Origin'), null);
    assert.equal((await handle(new Request('https://lb.example/board?b=daily'), e, NOW)).status, 400);
    assert.equal((await handle(new Request('https://lb.example/nope'), e, NOW)).status, 404);
    assert.equal((await handle(new Request('https://lb.example/submit', { method: 'OPTIONS', headers: { Origin: ORIGIN } }), e, NOW)).status, 204);
  });

  it('limits each address to RATE_PER_HOUR submissions an hour', async () => {
    const e = env();
    const run = { name: 'SPAM', waves: 1, kills: 1, seed: 1 };
    for (let i = 0; i < RATE_PER_HOUR; i++) assert.equal((await post(e, run, NOW + i, '9.9.9.9')).status, 200);
    assert.equal((await post(e, run, NOW + 100, '9.9.9.9')).status, 429);
    assert.equal((await post(e, run, NOW + 100, '8.8.8.8')).status, 200, 'another address is fine');
    assert.equal((await post(e, run, NOW + 3_700_000, '9.9.9.9')).status, 200, 'an hour later again');
  });
});

describe("Critter Clash's boards", () => {
  const TOKEN = 'secret-token';
  const ccEnv = (): Env => ({ DB: sqliteD1(), ALLOWED_ORIGINS: ORIGIN, IP_SALT: 'test', CC_SUBMIT_TOKEN: TOKEN });
  const life = (e: Env, body: unknown, at = NOW, token = TOKEN): Promise<Response> =>
    handle(new Request('https://lb.example/cc/submit', { method: 'POST', body: JSON.stringify(body), headers: { Authorization: `Bearer ${token}` } }), e, at);
  const ccGet = async (e: Env, query: string, at = NOW): Promise<Record<string, unknown>> =>
    (await (await handle(new Request(`https://lb.example/cc/board?${query}`), e, at)).json()) as Record<string, unknown>;

  it('only the game server (with the token) can post', async () => {
    const e = ccEnv();
    assert.equal((await life(e, { name: 'Ada', score: 50, kills: 40, prestige: 0 }, NOW, 'wrong')).status, 401);
    assert.equal((await life({ ...e, CC_SUBMIT_TOKEN: undefined }, { name: 'Ada', score: 50, kills: 40, prestige: 0 })).status, 401);
    assert.equal((await life(e, { name: 'Ada', score: 50, kills: 40, prestige: 0 })).status, 200);
  });

  it('keeps each name best: today for 24 hours, forever for good', async () => {
    const e = ccEnv();
    await life(e, { name: 'Ada', score: 50, kills: 40, prestige: 0 }, NOW - 2 * CC_TODAY_MS);
    await life(e, { name: 'Bix', score: 30, kills: 20, prestige: 0 });
    await life(e, { name: 'Ada', score: 20, kills: 10, prestige: 0 });
    const today = await ccGet(e, 'b=today&me=Ada');
    assert.deepEqual(today.entries, [{ rank: 1, name: 'Bix', score: 30 }, { rank: 2, name: 'Ada', score: 20 }]);
    assert.deepEqual(today.me, { rank: 2, name: 'Ada', score: 20 });
    const forever = await ccGet(e, 'b=forever');
    assert.deepEqual(forever.entries, [{ rank: 1, name: 'Ada', score: 50 }, { rank: 2, name: 'Bix', score: 30 }]);
    assert.equal(forever.total, 2);
  });

  it('refuses names that cannot go on a public board', async () => {
    const e = ccEnv();
    for (const name of ['', 'Player', 'a'.repeat(17), 'xxSHITxx']) assert.equal((await life(e, { name, score: 5, kills: 1, prestige: 0 })).status, 400, name);
    assert.equal((await life(e, { name: 'Ada', score: 0, kills: 0, prestige: 0 })).status, 400, 'a score of 0');
  });
});
