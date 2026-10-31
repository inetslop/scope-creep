/**
 * One running match and its connections: joins, reconnects, inputs, the tick loop and sending.
 * Transport-agnostic: the Node server hands it WebSockets, a match in the tab hands it an in-page
 * loopback, both as a Link. Either way every byte goes through the same protocol code.
 */
import { MAX_BACKLOG_BYTES, MAX_PLAYERS, PROTOCOL_VERSION, RECONNECT_GRACE_S, TICK_MS, TICK_RATE } from '../config.ts';
import type { Registry } from '../registry.ts';
import { Reader, Writer } from '../shared/codec.ts';
import { C2S, readInput, readJoin, writeReject, writeRoster, writeScores, writeWelcome, type InputMsg, type JoinMsg } from '../shared/protocol.ts';
import type { SimPlayer } from './entities.ts';
import { Match } from './match.ts';
import { writeSnapshot } from './snapshot.ts';

/** One connection, as the room sees it. */
export interface Link {
  send(data: Uint8Array): void;
  close(): void;
  /** Bytes queued but not yet sent (WebSocket.bufferedAmount). */
  readonly backlog: number;
}

export interface Connection {
  receive(data: Uint8Array): void;
  /** The link is gone. */
  closed(): void;
}

interface Client {
  link: Link;
  player: SimPlayer | undefined;
  /**
   * Clients send one input per tick, and every input moves the player exactly once, in order, so
   * the client can replay exactly the inputs the server hasn't applied yet (its ackSeq) on top of
   * the server's position and land where the server will.
   */
  inputs: InputMsg[];
  /** Ticks this client may still move for (one per tick, banked up to MAX_INPUT_CREDIT). */
  credit: number;
  /** Watching, not playing (the start screen): gets the snapshots of `follow`, the leader. */
  spectator: boolean;
  follow: SimPlayer | undefined;
  followUntil: number;
}

/** A spectator stays on one player this long before checking who leads now. */
const FOLLOW_SECONDS = 20;

/** Inputs kept waiting, at most (a client far ahead loses its oldest). */
const MAX_WAITING_INPUTS = 40;
/** Inputs applied in one tick, at most: a burst after a stall catches up over a few ticks. */
const MAX_INPUTS_PER_TICK = 4;
/** Ticks of credit a client can bank while its inputs are held up (1 s): never more moves than time. */
const MAX_INPUT_CREDIT = 20;
/** Waiting inputs beyond this, with no credit left, are a client running fast: the oldest is skipped. */
const MAX_BACKLOG = 6;

export interface RoomStatus {
  humans: number;
  bots: number;
  monsters: number;
  projectiles: number;
  tick: number;
  /** Mean simulation time per tick (ms, smoothed). */
  tickMs: number;
  /** Snapshot bytes sent per second, all clients together (smoothed). */
  bytesPerSecond: number;
  errors: string[];
}

const now = (): number => performance.now();

function newToken(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function cleanName(name: string): string {
  // eslint-disable-next-line no-control-regex
  const s = name.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 16);
  return s || 'Player';
}

export class Room {
  readonly match: Match;
  private readonly clients = new Set<Client>();
  private readonly writer = new Writer(64 * 1024);
  private rosterDirty = true;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private nextAt = 0;
  private tickMs = 0;
  private bytesPerSecond = 0;
  private bytesThisSecond = 0;

  constructor(registry: Registry, seed: number) {
    this.match = new Match(registry, seed);
    this.fillBots();
  }

  connect(link: Link): Connection {
    const c: Client = { link, player: undefined, inputs: [], credit: 0, spectator: false, follow: undefined, followUntil: 0 };
    this.clients.add(c);
    return { receive: (data) => this.receive(c, data), closed: () => this.drop(c) };
  }

  private receive(c: Client, data: Uint8Array): void {
    try {
      const r = new Reader(data);
      const type = r.u8();
      if (type === C2S.join) {
        if (!c.player) this.join(c, readJoin(r));
        return;
      }
      if (type === C2S.spectate) {
        if (!c.player && !c.spectator) this.spectate(c, r.u8());
        return;
      }
      const p = c.player;
      if (!p) return;
      if (type === C2S.input) {
        c.inputs.push(readInput(r));
        if (c.inputs.length > MAX_WAITING_INPUTS) c.inputs.shift();
      } else if (type === C2S.pick) {
        this.match.pick(p, r.u16());
      } else {
        throw new Error(`unknown message ${type}`);
      }
    } catch {
      // Malformed input: this client is broken or hostile. Drop it.
      c.link.close();
      this.drop(c);
    }
  }

  private send(c: Client, data: Uint8Array): void {
    c.link.send(data);
    this.bytesThisSecond += data.byteLength;
  }

  private reject(c: Client, reason: string): void {
    writeReject(this.writer.reset(), reason);
    this.send(c, this.writer.finish());
    c.link.close();
    this.clients.delete(c);
  }

  private humans(): SimPlayer[] {
    return [...this.match.players.values()].filter((p) => !p.bot);
  }

  private join(c: Client, msg: JoinMsg): void {
    if (msg.protocol !== PROTOCOL_VERSION) {
      this.reject(c, 'The game was updated. Reload the page.');
      return;
    }
    let p = msg.token ? this.humans().find((q) => !q.connected && q.token === msg.token) : undefined;
    if (!p) {
      if (this.humans().length >= MAX_PLAYERS) {
        this.reject(c, `The arena is full (${MAX_PLAYERS} players). Try again in a minute.`);
        return;
      }
      p = this.match.addPlayer(cleanName(msg.name), false, newToken(), msg.color, msg.wear);
    }
    p.connected = true;
    c.player = p;
    const { width, height } = this.match.rules.world;
    writeWelcome(this.writer.reset(), {
      protocol: PROTOCOL_VERSION,
      playerId: p.id,
      token: p.token,
      tickRate: TICK_RATE,
      worldWidth: width,
      worldHeight: height,
      contentHash: this.match.registry.hash,
    });
    this.send(c, this.writer.finish());
    this.rosterDirty = true;
    this.fillBots();
  }

  /** A watcher: no player, no slot; gets the roster, scores and the leader's snapshots. */
  private spectate(c: Client, protocol: number): void {
    if (protocol !== PROTOCOL_VERSION) {
      this.reject(c, 'The game was updated. Reload the page.');
      return;
    }
    c.spectator = true;
    const { width, height } = this.match.rules.world;
    writeWelcome(this.writer.reset(), { protocol: PROTOCOL_VERSION, playerId: 0, token: '', tickRate: TICK_RATE, worldWidth: width, worldHeight: height, contentHash: this.match.registry.hash });
    this.send(c, this.writer.finish());
    this.rosterDirty = true;
  }

  /** Who a spectator watches: the leader (humans first), kept for a while, changed when they go down or leave. */
  private followFor(c: Client): SimPlayer | undefined {
    const f = c.follow;
    if (f && f.alive && this.match.players.has(f.id) && this.match.time < c.followUntil) return f;
    const alive = [...this.match.players.values()].filter((p) => p.alive);
    if (alive.length === 0) return f && this.match.players.has(f.id) ? f : undefined;
    const humans = alive.filter((p) => !p.bot);
    const pool = humans.length ? humans : alive;
    c.follow = pool.reduce((a, b) => (b.score > a.score ? b : a));
    c.followUntil = this.match.time + FOLLOW_SECONDS;
    return c.follow;
  }

  private drop(c: Client): void {
    if (!this.clients.delete(c)) return;
    const p = c.player;
    if (p) {
      p.connected = false;
      p.leftAt = this.match.time;
      this.match.setInput(p, p.ackSeq, 0, 0, p.input.aim, 0);
    }
    this.rosterDirty = true;
  }

  /** Keeps rules.bots.fillTo players in the match: bots leave as humans arrive. */
  private fillBots(): void {
    const rules = this.match.rules.bots;
    const want = Math.max(0, rules.fillTo - this.humans().length);
    const bots = [...this.match.players.values()].filter((p) => p.bot);
    if (bots.length === want) return;
    while (bots.length < want) {
      const taken = new Set(bots.map((b) => b.name));
      const name = rules.names.find((n) => !taken.has(n)) ?? `Bot ${bots.length + 1}`;
      bots.push(this.match.addPlayer(name, true, ''));
    }
    bots.sort((a, b) => a.score - b.score);
    while (bots.length > want) this.match.removePlayer(bots.shift()!.id);
    this.rosterDirty = true;
  }

  /** Humans whose connection has been gone too long leave for good. */
  private dropGhosts(): void {
    for (const p of this.humans()) {
      if (!p.connected && this.match.time - p.leftAt > RECONNECT_GRACE_S) {
        this.match.removePlayer(p.id);
        this.rosterDirty = true;
        this.fillBots();
      }
    }
  }

  /** One tick: simulate, then send every joined client its snapshot. */
  step(): void {
    for (const c of this.clients) {
      if (!c.player) continue;
      // Every input moves the player exactly once, in order: the client predicts that, so the
      // server lands where the client already shows the player (no rubber-banding). The network
      // delivers inputs unevenly (a relay holds some back, then sends a bunch): with none waiting
      // the player stands still this tick instead of guessing, and a bunch catches up over the
      // next ticks, a few at a time. Credit (one per tick, banked up to 1 s) keeps a client from
      // ever moving more than time allows.
      const p = c.player;
      const waiting = c.inputs;
      if (!p.alive) {
        // Knocked out: nothing moves, and nothing waits to push the player around after respawning.
        const last = waiting[waiting.length - 1];
        if (last) this.match.setInput(p, last.seq, 0, 0, last.aim, 0);
        waiting.length = 0;
        c.credit = 0;
        continue;
      }
      c.credit = Math.min(MAX_INPUT_CREDIT, c.credit + 1);
      // A client steadily sending faster than the tick (no credit, a growing backlog) is trimmed.
      if (c.credit <= 1 && waiting.length > MAX_BACKLOG) waiting.splice(0, waiting.length - MAX_BACKLOG);
      const n = Math.min(waiting.length, c.credit, MAX_INPUTS_PER_TICK);
      if (n === 0) {
        this.match.setInput(p, p.ackSeq, 0, 0, p.input.aim, p.input.buttons);
        continue;
      }
      const batch = waiting.splice(0, n);
      c.credit -= n;
      let buttons = 0;
      for (const q of batch) buttons |= q.buttons;
      // All but the last move now; the last is this tick's own move (and the seq the client sees acked).
      for (const q of batch.slice(0, -1)) this.match.catchUp(p, q.moveX, q.moveY, q.aim);
      const m = batch[batch.length - 1]!;
      this.match.setInput(p, m.seq, m.moveX, m.moveY, m.aim, buttons);
    }
    const t0 = now();
    this.match.step();
    if (this.match.tick % TICK_RATE === 0) this.dropGhosts();
    const ms = now() - t0;
    this.tickMs = this.tickMs ? this.tickMs * 0.95 + ms * 0.05 : ms;

    const joined = [...this.clients].filter((c) => c.player || c.spectator);
    if (this.rosterDirty) {
      this.rosterDirty = false;
      writeRoster(
        this.writer.reset(),
        [...this.match.players.values()].map((p) => ({ id: p.id, name: p.name, color: p.color, bot: p.bot, wear: p.wear })),
      );
      const roster = this.writer.finish();
      for (const c of joined) this.send(c, roster);
    }
    if (this.match.tick % TICK_RATE === 0) {
      writeScores(
        this.writer.reset(),
        [...this.match.players.values()].map((p) => ({ id: p.id, score: p.score, level: p.level, kills: p.kills, prestige: p.prestige })),
      );
      const scores = this.writer.finish();
      for (const c of joined) this.send(c, scores);
      this.bytesPerSecond = this.bytesPerSecond ? this.bytesPerSecond * 0.8 + this.bytesThisSecond * 0.2 : this.bytesThisSecond;
      this.bytesThisSecond = 0;
    }
    for (const c of joined) {
      if (c.link.backlog > MAX_BACKLOG_BYTES) continue;
      const view = c.player ?? this.followFor(c);
      if (!view) continue;
      writeSnapshot(this.writer.reset(), this.match, view);
      this.send(c, this.writer.finish());
    }
  }

  /** Runs the tick loop on a timer, catching up after short stalls (but never more than a second). */
  start(): void {
    if (this.timer !== undefined) return;
    this.nextAt = now();
    const loop = (): void => {
      this.step();
      this.nextAt += TICK_MS;
      const late = now() - this.nextAt;
      if (late > 1000) this.nextAt = now();
      this.timer = setTimeout(loop, Math.max(0, this.nextAt - now()));
    };
    this.timer = setTimeout(loop, 0);
  }

  stop(): void {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
    for (const c of [...this.clients]) {
      c.link.close();
      this.drop(c);
    }
  }

  status(): RoomStatus {
    const players = [...this.match.players.values()];
    return {
      humans: players.filter((p) => !p.bot).length,
      bots: players.filter((p) => p.bot).length,
      monsters: this.match.monsters.length,
      projectiles: this.match.projectiles.length,
      tick: this.match.tick,
      tickMs: Math.round(this.tickMs * 100) / 100,
      bytesPerSecond: Math.round(this.bytesPerSecond),
      errors: this.match.errors.slice(-20),
    };
  }
}
