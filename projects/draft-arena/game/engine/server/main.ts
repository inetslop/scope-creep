/**
 * The game server: one match on one port, over WebSockets. Runs directly from source:
 *
 *   node engine/server/main.ts      (Node 24+)
 *   bun engine/server/main.ts
 *
 * From the environment:
 *   PORT (8790), HOST (0.0.0.0)
 *   STATIC_DIR  serve the built page from this folder too (`dist`), so one box serves the page and
 *               the match from one build: build it with VITE_SERVER_URL=same-origin
 *   BUILD_ID    goes into the content hash; build the page with the same VITE_BUILD_ID, and a page
 *               from any other deploy is told to reload
 * GET /status answers the room's status as JSON (players, tick time, bytes per second, errors, the
 * build id), for a health check. Without STATIC_DIR, every GET does. Browsers on an https page need wss://: put
 * the server behind a TLS tunnel (Tailscale Funnel, a Cloudflare Tunnel).
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { WebSocketServer, type RawData } from 'ws';
import { CONTENT } from '../../src/content/index.ts';
import { DEFAULT_PORT } from '../config.ts';
import { buildRegistry } from '../registry.ts';
import { Room } from '../sim/room.ts';
import { resolveStatic } from './static.ts';

const port = Number(process.env.PORT) || DEFAULT_PORT;
const host = process.env.HOST || '0.0.0.0';

const staticDir = process.env.STATIC_DIR ? path.resolve(process.env.STATIC_DIR) : undefined;
const registry = buildRegistry(CONTENT, process.env.BUILD_ID ?? '');
const room = new Room(registry, Date.now() & 0x7fffffff);

const server = http.createServer((req, res) => {
  const url = req.url ?? '/';
  if (!staticDir || url === '/status' || url.startsWith('/status?')) {
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'cache-control': 'no-store' });
    res.end(JSON.stringify({ ...room.status(), build: process.env.BUILD_ID ?? '' }));
    return;
  }
  const notFound = (): void => {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  };
  const found = req.method === 'GET' || req.method === 'HEAD' ? resolveStatic(staticDir, url) : undefined;
  if (!found) {
    notFound();
    return;
  }
  fs.stat(found.file, (err, stat) => {
    if (err || !stat.isFile()) {
      notFound();
      return;
    }
    res.writeHead(200, { 'content-type': found.type, 'content-length': stat.size, 'cache-control': found.cache, 'x-content-type-options': 'nosniff' });
    if (req.method === 'HEAD') res.end();
    else fs.createReadStream(found.file).on('error', () => res.destroy()).pipe(res);
  });
});

const toBytes = (data: RawData): Uint8Array => {
  if (Array.isArray(data)) return new Uint8Array(Buffer.concat(data));
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
};

const wss = new WebSocketServer({ server, maxPayload: 4096, perMessageDeflate: false });
wss.on('connection', (ws) => {
  const conn = room.connect({
    send: (data) => ws.send(data),
    close: () => ws.close(),
    get backlog() {
      return ws.bufferedAmount;
    },
  });
  ws.on('message', (data, isBinary) => {
    if (!isBinary) {
      ws.close();
      return;
    }
    conn.receive(toBytes(data));
  });
  ws.on('close', () => conn.closed());
  ws.on('error', () => ws.close());
});

server.listen(port, host, () => {
  console.log(`draft-arena server on ${host}:${port} (content ${registry.hash.toString(16)}${process.env.BUILD_ID ? `, build ${process.env.BUILD_ID}` : ''}${staticDir ? `, page from ${staticDir}` : ''})`);
});
room.start();

setInterval(() => {
  const s = room.status();
  console.log(`players ${s.humans}+${s.bots} bots, monsters ${s.monsters}, projectiles ${s.projectiles}, tick ${s.tickMs} ms, out ${(s.bytesPerSecond / 1024).toFixed(1)} KiB/s`);
}, 60_000).unref();

const shutdown = (): void => {
  room.stop();
  wss.close();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000).unref();
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
