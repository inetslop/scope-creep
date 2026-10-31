/**
 * The leaderboard on localhost, over SQLite instead of D1, to try the game's boards without
 * Cloudflare:
 *
 *   bun leaderboard/dev.ts                 (http://localhost:8787, data in leaderboard/.dev.sqlite)
 *   VITE_BOARDS_URL=http://localhost:8787 bun --bun run dev     (in projects/chokepoint/game)
 *   LEADERBOARD_URL=http://localhost:8787 LEADERBOARD_TOKEN=dev bun engine/server/main.ts   (Critter Clash, in projects/draft-arena/game)
 */
import path from 'node:path';
import { sqliteD1 } from './sqlite.ts';
import { handle, type Env } from './src/worker.ts';

const port = Number(process.env.PORT ?? 8787);
const env: Env = {
  DB: sqliteD1(path.join(import.meta.dirname, '.dev.sqlite')),
  ALLOWED_ORIGINS: 'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174',
  IP_SALT: 'dev',
  // Critter Clash's game server posts with this (LEADERBOARD_TOKEN=dev on a local game server).
  CC_SUBMIT_TOKEN: process.env.CC_SUBMIT_TOKEN ?? 'dev',
};

Bun.serve({ port, fetch: (request) => handle(request, env) });
console.log(`leaderboard on http://localhost:${port}`);
