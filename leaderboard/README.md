# The leaderboards

The Worker serves two games' boards: Chokepoint's (below) and Critter Clash's (further down).

Two boards for Chokepoint: **Today** (the last 24 hours, rolling) and **Forever**. Players post as four letters; each board shows every name's best run.

It's a Cloudflare Worker (`src/worker.ts`) over a D1 (SQLite) database (`migrations/`), both on Cloudflare's free plan. The game talks to it from `projects/chokepoint/game/src/net/boards.ts`. Without a server address the game simply has no boards, and the smoke test never uses them.

## What it checks

`src/rules.ts` checks every submitted run:
- the name is four letters and not on a short blocked list;
- the waves and kills are whole, sane numbers;
- the score is computed on the server from waves and kills, never sent.

Each address (stored as a salted hash) may post 30 runs an hour. That stops casual nonsense, but not someone determined to fake a score.

## Where it runs

Live at <https://chokepoint-leaderboard.scope-creep.workers.dev>. The D1 database `chokepoint-leaderboard` is in `wrangler.toml`. The site build gives the game that address (`VITE_BOARDS_URL` in `.github/workflows/deploy.yml`; a repository variable `LEADERBOARD_URL` overrides it).

## Deploying a change

Deploying is done by hand from a logged-in machine. Wrangler needs Node: Bun runs it, but it exits before Cloudflare answers. On the main PC a portable Node is in `~/.cache/scope-creep-node/`.

```sh
cd leaderboard
export PATH=~/.cache/scope-creep-node/node-v22.21.0-linux-x64/bin:$PATH   # the main PC
npx wrangler@4 login                                            # once, in the browser
npx wrangler@4 d1 migrations apply chokepoint-leaderboard --remote   # only for a new migration
npx wrangler@4 deploy
```

`.github/workflows/leaderboard.yml` can do the same on every push, once the repo has the secrets `CLOUDFLARE_API_TOKEN` (the Edit Cloudflare Workers template plus Account → D1 → Edit) and `CLOUDFLARE_ACCOUNT_ID`. Until then it skips.

## Trying it locally

```sh
bun leaderboard/dev.ts                                  # the same Worker over SQLite, http://localhost:8787
cd projects/chokepoint/game
VITE_BOARDS_URL=http://localhost:8787 bun --bun run dev # the game, with its boards on
```

Tests: `bun test ./leaderboard/`.

## Critter Clash

Under `/cc/` (`src/critter.ts`, tables in `migrations/0003_critter_clash.sql`): **Today** (each name's best life of the last 24 hours) and **All time**. A run is one life of one player, posted by the game server only (`projects/draft-arena/game/engine/server/leaderboard.ts`), with `Authorization: Bearer <CC_SUBMIT_TOKEN>` (a Worker secret: `wrangler secret put CC_SUBMIT_TOKEN`; the box's side is in `deploy/arena/README.md`). The match runs on the server, so its scores can be trusted; no browser posts. Names are the game's (1 to 16 characters); the default "Player" and names with a blocked word in them never go on a board. The page reads the boards through the game server (`GET /leaderboard`), so the Worker needs no CORS for it.

```sh
GET  /cc/board?b=today&me=Ada&limit=10
GET  /cc/board?b=forever&me=Ada
POST /cc/submit   {name, score, kills, prestige}     (server only)
```

Locally: `bun leaderboard/dev.ts` accepts the token `dev`; run the game server with `LEADERBOARD_URL=http://localhost:8787 LEADERBOARD_TOKEN=dev`.

