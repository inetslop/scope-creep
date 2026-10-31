/**
 * The leaderboard: a Cloudflare Worker (leaderboard/ at the repo root, its /cc/ routes). With
 * LEADERBOARD_URL and LEADERBOARD_TOKEN set, the server posts every human life that ends with a
 * score (the match is server-authoritative, so the scores can be trusted), and answers the page's
 * GET /leaderboard?b=today|forever&me=Name from the Worker, cached for a few seconds: the page never
 * needs the Worker's address or its secret. Without them there is no leaderboard (404).
 */
import type { LifeEnd } from '../sim/match.ts';

const CACHE_MS = 15_000;
const TIMEOUT_MS = 5_000;

export interface Leaderboard {
  /** Posts a life that ended (lives without a score are skipped). Never throws. */
  submit(life: LifeEnd): void;
  /** One board, as JSON for the page. */
  board(query: URLSearchParams): Promise<{ status: number; body: string }>;
}

export function leaderboardFromEnv(env: NodeJS.ProcessEnv = process.env): Leaderboard | undefined {
  const base = env.LEADERBOARD_URL?.replace(/\/+$/, '');
  const token = env.LEADERBOARD_TOKEN;
  if (!base || !token) return undefined;
  const cache = new Map<string, { at: number; status: number; body: string }>();
  let failures = 0;
  return {
    submit(life) {
      if (!(life.score >= 1)) return;
      fetch(`${base}/cc/submit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: life.name, score: Math.floor(life.score), kills: Math.floor(life.kills), prestige: Math.floor(life.prestige) }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
        .then((res) => {
          // 400: a name that can't go on a public board (the default name, a blocked word). Not an error.
          if (!res.ok && res.status !== 400 && failures++ < 20) console.warn(`leaderboard: posting a life failed (${res.status})`);
        })
        .catch((err: unknown) => {
          if (failures++ < 20) console.warn(`leaderboard: posting a life failed: ${err instanceof Error ? err.message : String(err)}`);
        });
    },
    async board(query) {
      const b = query.get('b') === 'forever' ? 'forever' : 'today';
      const me = (query.get('me') ?? '').slice(0, 16);
      const key = `${b}\n${me}`;
      const hit = cache.get(key);
      if (hit && Date.now() - hit.at < CACHE_MS) return hit;
      try {
        const res = await fetch(`${base}/cc/board?b=${b}&limit=10&me=${encodeURIComponent(me)}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
        const out = { at: Date.now(), status: res.status, body: await res.text() };
        if (cache.size > 500) cache.clear();
        cache.set(key, out);
        return out;
      } catch {
        return hit ?? { status: 502, body: JSON.stringify({ error: 'leaderboard unreachable' }) };
      }
    },
  };
}
