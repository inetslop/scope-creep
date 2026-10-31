# Engine

Owner-only. The fleet's agents can read it but not change it (`loop/sandbox.ts` reverts edits under any game's `engine/`). Game code uses `api.ts` and nothing else.

## How a match runs

- **`sim/match.ts`**: the authoritative simulation, pure TypeScript with no I/O. 20 ticks a second: players move (bots think first), monsters think and move, weapons fire, projectiles fly and hit, areas pulse, contact damage, statuses, pickups, deaths, spawning. Content hooks run through the `Ctx`. A hook that throws is logged in `match.errors` and its item is disabled for the match.
- **`sim/room.ts`**: a match plus its connections, transport-agnostic (`Link`). Joins (with a reconnect token, 30 s grace), one queued input applied per tick per client, bots filling to `rules.bots.fillTo`, and the tick loop. Every tick each client gets its snapshot; once a second, the scores; the roster when it changes.
- **Talents** (`talents.ts`): what a talent still needs and what can be taken (`missingFor`, `canTake`, `takeable`), used by the server to allow a pick and by the client to show the trees. A player holds ranks per talent and banked points; a pick names a talent (its registry index), and the server takes a rank if its needs are met. Players' `pierce` and `shots` stats are applied to every projectile they fire (`Match.fire`).
- **`sim/snapshot.ts`**: interest management. A player gets entities within `INTEREST_RADIUS` and events within `EVENT_RADIUS`.
- **`server/main.ts`**: the Room behind a `ws` WebSocket server; `GET /status` gives status JSON, and with `STATIC_DIR` the same port serves the built page (`server/static.ts`).
- **Bots** fill every match to `rules.bots.fillTo` players (6) and leave as humans join, online and in the tab alike.
- **Art:** the Critters style lives in `api.ts` (`drawCritter`, `drawFace`, `paintIcon`) so content can reuse it, and in `client/render.ts` (the field, areas, labels, bars). Fredoka is bundled from `@fontsource/fredoka`.
- **`client/`**: `session.ts` (interpolation 110 ms in the past, own-player prediction with input replay, path projectiles, effects), `render.ts`, `input.ts`, `menu.ts`, `hud.ts` (hosts `src/hud/`), `socket.ts` (WebSocket, or a Room in the tab when no server is set and for the smoke test), `testHook.ts`.
- **`shared/protocol.ts`**: the wire format, both directions in one file.

## The wire

An entity is 10 bytes (id u16, kind u8, x/y u16 at quarter units, angle u8, hp u8, flags u8), plus 2 per non-zero slot, statuses when present, and a radius when it differs from its kind's default. Path projectiles travel once as a 26-byte launch; effects are 12 bytes. Measured with 60 bots: about 15 KiB/s per player when crowded, 12 KiB/s spread out, under 1 ms of simulation per tick.

Content changes never change the wire: kinds, upgrades, statuses and effects are numbered in registry order on both sides, and the welcome message carries a hash of every id (and the build id, when one is set) so a stale client is told to reload.

## Changing the engine

Owner or frontier-model work. Things that need it: a new input (an aimed ability, a second button on touch), more slots, rounds/zones, world size that grows with the player count, a persistent leaderboard. Bump `PROTOCOL_VERSION` whenever the bytes change. Run `npm run check`, `npm run smoke` and, against a running server, `npm run soak -- --url ws://localhost:8790 --clients 60`.

## Hosting

The live server is a home box that serves the page and the match from one build of one commit, and updates itself from GitHub: `deploy/arena/` at the repo root (setup, self-update, rollback). GitHub Pages keeps the build without a server: Play there starts the same match in the tab, against bots.

`npm run server` (Node 24, or `bun engine/server/main.ts`) listens on `PORT` (8790) and `HOST` (0.0.0.0). From the environment:
- `STATIC_DIR=dist`: the same port serves the built page; `GET /status` is the status JSON (players, tick time, bytes per second, content errors).
- `BUILD_ID=<commit>`: goes into the content hash. Build the page with the same `VITE_BUILD_ID`, and pages from any other deploy reload (the start screen does it by itself; Play says to).
- The page: `VITE_SERVER_URL=same-origin` connects to the host that served it (`wss://` on https). `VITE_SERVER_URL=wss://<host>` points it elsewhere; without one, Play runs the match in the tab.

Browsers on an https page need `wss://`: put the server behind a TLS tunnel (the box uses Tailscale Funnel). A client and server must come from the same build; deploy both together.
