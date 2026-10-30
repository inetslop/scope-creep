import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sqliteD1 } from '../sqlite.ts';
import { checkSubmission, maxKills } from '../src/rules.ts';
import { handle, RATE_PER_HOUR, rankEntries, TODAY_MS, type Env } from '../src/worker.ts';

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
    assert.deepEqual(c.run, { name: 'ABCD', waves: 12, kills: 340, seed: 77, score: 1540 });
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
    const rows = [{ name: 'AAAA', score: 900, waves: 9 }, { name: 'BBBB', score: 700, waves: 7 }, { name: 'CCCC', score: 700, waves: 7 }, { name: 'DDDD', score: 500, waves: 5 }];
    assert.deepEqual(rankEntries(rows).map((e) => e.rank), [1, 2, 2, 4]);
  });
});

describe('the Worker', () => {
  it('puts a run on both boards; a name keeps only its best on each', async () => {
    const e = env();
    const first = (await (await post(e, { name: 'MATT', waves: 20, kills: 900, seed: 1 })).json()) as Record<string, unknown>;
    assert.deepEqual(first, { today: { rank: 1, total: 1, score: 2900, best: true }, forever: { rank: 1, total: 1, score: 2900, best: true } });
    await post(e, { name: 'ANNA', waves: 30, kills: 1500, seed: 5 });
    const worse = (await (await post(e, { name: 'MATT', waves: 3, kills: 10, seed: 9 })).json()) as Record<string, { rank: number; best: boolean; score: number }>;
    assert.deepEqual(worse.forever, { rank: 2, total: 2, score: 2900, best: false }, 'the earlier, better run keeps its place');
    assert.deepEqual(worse.today, { rank: 2, total: 2, score: 2900, best: false });

    const forever = await get(e, 'b=forever&me=matt');
    assert.deepEqual(forever.entries, [
      { rank: 1, name: 'ANNA', score: 4500, waves: 30 },
      { rank: 2, name: 'MATT', score: 2900, waves: 20 },
    ]);
    assert.equal(forever.total, 2);
    assert.deepEqual(forever.me, { rank: 2, name: 'MATT', score: 2900, waves: 20 });
    const today = await get(e, 'b=today&me=MATT');
    assert.deepEqual(today.entries, forever.entries, 'each name\'s best run of the day, with its waves');
    assert.equal(today.total, 2);
  });

  it('today is the last 24 hours: older runs drop off it, forever keeps them', async () => {
    const e = env();
    await post(e, { name: 'OLDY', waves: 50, kills: 3000, seed: 1 }, NOW - TODAY_MS - 60_000);
    await post(e, { name: 'NEWY', waves: 5, kills: 100, seed: 2 }, NOW - 3_600_000);
    assert.deepEqual(names(await get(e, 'b=today')), ['NEWY']);
    assert.deepEqual(names(await get(e, 'b=forever')), ['OLDY', 'NEWY']);
    const later = (await (await post(e, { name: 'OLDY', waves: 2, kills: 5, seed: 3 })).json()) as Record<string, { rank: number; best: boolean; score: number }>;
    assert.deepEqual(later.today, { rank: 2, total: 2, score: 205, best: true }, 'today counts only the run of today');
    assert.deepEqual(later.forever, { rank: 1, total: 2, score: 8000, best: false });
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
