/**
 * Soak test against a running server, over real WebSockets: N fake players join, wander, take
 * talents, and the tool reports what each receives per second.
 *
 *   npm run soak -- --url ws://localhost:8790 --clients 60 --seconds 60
 *
 * For checking a home server and its upload before a busy night. (The headless budget test that
 * runs in `npm run check` is engine/tests/load.test.ts.)
 */
import { parseArgs } from 'node:util';
import { WebSocket } from 'ws';
import { CONTENT } from '../../src/content/index.ts';
import { PROTOCOL_VERSION, TICK_MS } from '../config.ts';
import { buildRegistry, kindRadius } from '../registry.ts';
import { Reader, Writer } from '../shared/codec.ts';
import { S2C, readSnapshot, writeInput, writeJoin, writePick } from '../shared/protocol.ts';
import { takeable } from '../talents.ts';

const { values } = parseArgs({
  options: {
    url: { type: 'string', default: 'ws://localhost:8790' },
    clients: { type: 'string', default: '60' },
    seconds: { type: 'string', default: '30' },
  },
});
const url = values.url!;
const count = Math.max(1, Number(values.clients) || 60);
const seconds = Math.max(5, Number(values.seconds) || 30);
const registry = buildRegistry(CONTENT);

interface Bot {
  ws: WebSocket;
  bytes: number;
  snapshots: number;
  seq: number;
  angle: number;
  joined: boolean;
  closed: boolean;
}

const bots: Bot[] = [];
for (let i = 0; i < count; i++) {
  const ws = new WebSocket(url);
  ws.binaryType = 'arraybuffer';
  const bot: Bot = { ws, bytes: 0, snapshots: 0, seq: 0, angle: Math.random() * Math.PI * 2, joined: false, closed: false };
  bots.push(bot);
  const w = new Writer(256);
  ws.on('open', () => {
    writeJoin(w.reset(), { protocol: PROTOCOL_VERSION, name: `soak ${i + 1}`, token: '' });
    ws.send(w.finish());
  });
  ws.on('message', (data: ArrayBuffer) => {
    bot.bytes += data.byteLength;
    const r = new Reader(data);
    const type = r.u8();
    if (type === S2C.welcome) bot.joined = true;
    if (type === S2C.reject) console.log(`client ${i + 1} rejected: ${r.str()}`);
    if (type !== S2C.snapshot) return;
    bot.snapshots++;
    const s = readSnapshot(r, (kind) => kindRadius(registry, kind));
    if (s.self.pendingPicks > 0 && Math.random() < 0.1) {
      const ranks = new Map(s.self.talents.map((t) => [registry.talentList[t.index]!, t.rank]));
      const levels = new Map(s.self.upgrades.map((u) => [CONTENT.upgrades[u.index]!, u.level]));
      const options = takeable(registry, (t) => ranks.get(t) ?? 0, (u) => levels.get(u) ?? 0);
      if (options.length) {
        writePick(w.reset(), registry.talentIndex.get(options[Math.floor(Math.random() * options.length)]!)!);
        ws.send(w.finish());
      }
    }
  });
  ws.on('close', () => (bot.closed = true));
  ws.on('error', (err) => console.log(`client ${i + 1}: ${err.message}`));
}

const w = new Writer(256);
const inputs = setInterval(() => {
  for (const b of bots) {
    if (!b.joined || b.closed) continue;
    if (Math.random() < 0.02) b.angle += (Math.random() - 0.5) * 2;
    b.seq = (b.seq + 1) & 0xffff;
    writeInput(w.reset(), { seq: b.seq, moveX: Math.cos(b.angle), moveY: Math.sin(b.angle), aim: b.angle, buttons: 0 });
    b.ws.send(w.finish());
  }
}, TICK_MS);

const started = Date.now();
const report = setInterval(() => {
  const t = (Date.now() - started) / 1000;
  const live = bots.filter((b) => b.joined && !b.closed);
  const perClient = live.length ? live.reduce((s, b) => s + b.bytes, 0) / live.length / t : 0;
  const snaps = live.length ? live.reduce((s, b) => s + b.snapshots, 0) / live.length / t : 0;
  console.log(`${t.toFixed(0)}s: ${live.length}/${count} connected, ${(perClient / 1024).toFixed(1)} KiB/s and ${snaps.toFixed(1)} snapshots/s per client, ${((perClient * live.length * 8) / 1e6).toFixed(1)} Mbit/s total`);
}, 5000);

setTimeout(() => {
  clearInterval(inputs);
  clearInterval(report);
  for (const b of bots) b.ws.close();
  setTimeout(() => process.exit(0), 500);
}, seconds * 1000);
