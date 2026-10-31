/**
 * One play session on the client: the connection, the snapshot buffer and everything that turns
 * 20 snapshots a second into smooth frames.
 *
 * - Other entities are drawn INTERP_DELAY_MS in the past, interpolated between the two snapshots
 *   around that moment.
 * - Your own player is predicted: the server's position plus the inputs it hasn't applied yet
 *   (newer than its ackSeq), each worth one tick, plus the input in progress. Corrections are
 *   smoothed out instead of jumping.
 * - Path projectiles are computed from their launch with the content's path(); effects play when
 *   the drawn time reaches the tick they happened on, in step with the interpolated entities.
 */
import type { EffectDef, EffectView, ProjectileDef } from '../api.ts';
import { INTERP_DELAY_MS, PROTOCOL_VERSION, TICK_DT, TICK_MS } from '../config.ts';
import { kindRadius, type Registry } from '../registry.ts';
import { Reader, Writer } from '../shared/codec.ts';
import {
  S2C,
  readRoster,
  readScores,
  readSnapshot,
  readWelcome,
  writeInput,
  writeJoin,
  writePick,
  writeSpectate,
  type RosterEntry,
  type ScoreEntry,
  type WelcomeMsg,
  type WireWear,
  type WireEntity,
  type WireLaunch,
  type WireSelf,
  type WireSnapshot,
} from '../shared/protocol.ts';
import { hashString } from '../shared/rng.ts';
import type { ClientSocket } from './socket.ts';

export interface FrameEntity extends WireEntity {
  me: boolean;
  /** Units per second, from the two snapshots it is drawn between (0 when unknown). */
  speed: number;
}

export interface FrameShot {
  def: ProjectileDef;
  x: number;
  y: number;
  angle: number;
  speed: number;
  seed: number;
}

export interface Frame {
  /** Local clock, seconds (animations). */
  time: number;
  /** Where the camera looks: your player, or where you fell. */
  camX: number;
  camY: number;
  entities: FrameEntity[];
  shots: FrameShot[];
  effects: { def: EffectDef; view: EffectView }[];
}

export type SessionState = 'connecting' | 'playing' | 'reconnecting' | 'closed';

export interface InputState {
  moveX: number;
  moveY: number;
  aim: number;
  buttons: number;
}

interface Snap {
  s: WireSnapshot;
  /** Server time of the snapshot, ms. */
  time: number;
  byId: Map<number, WireEntity>;
}

interface PathShot {
  launch: WireLaunch;
  def: ProjectileDef;
  start: number;
  end: number;
}

interface FxShot {
  def: EffectDef;
  view: EffectView;
  start: number;
}

/** a is newer than b, with uint16 wrap-around. */
const seqNewer = (a: number, b: number): boolean => a !== b && ((a - b) & 0xffff) < 0x8000;
const quantize = (v: number): number => Math.max(-127, Math.min(127, Math.round(v * 127))) / 127;
const MAX_RETRIES = 5;

export class Session {
  state: SessionState = 'connecting';
  /** Why it closed, for the menu. */
  reason = '';
  /** It closed because the server runs another build: only a reload can fix that. */
  outdated = false;
  welcome: WelcomeMsg | undefined;
  readonly roster = new Map<number, RosterEntry>();
  scores: ScoreEntry[] = [];
  self: WireSelf | undefined;
  readonly mode: 'online' | 'offline';
  readonly stats = { snapshots: 0, launches: 0, effects: 0, maxEntities: 0, monstersInView: 0, deaths: 0, picks: 0 };

  private readonly registry: Registry;
  private readonly connect: () => ClientSocket;
  private readonly name: string;
  private socket: ClientSocket | undefined;
  private readonly writer = new Writer(256);
  private token = '';
  private retries = 0;
  private snaps: Snap[] = [];
  private offset: number | undefined;
  private readonly paths = new Map<number, PathShot>();
  private fx: FxShot[] = [];
  private seq = 0;
  private sendAccum = 0;
  private history: { seq: number; mx: number; my: number }[] = [];
  private lastTarget: { x: number; y: number } | undefined;
  private smoothX = 0;
  private smoothY = 0;
  private me: { x: number; y: number } | undefined;
  private lastCam: { x: number; y: number } | undefined;
  private readonly failed = new Set<object>();
  /** Watching, not playing: no inputs, and the camera follows the player the server shows (the leader). */
  readonly spectating: boolean;

  /** What this player looks like: sent when joining. */
  private readonly look: { color: number | undefined; wear: WireWear };
  /** Coins and prestiges the server reported that the profile hasn't been given yet (takeEarnings()). */
  private coinsSeen = 0;
  private prestigeSeen = 0;
  private earned = { coins: 0, prestiges: 0 };

  constructor(
    registry: Registry,
    connect: () => ClientSocket,
    name: string,
    mode: 'online' | 'offline',
    spectate = false,
    look: { color: number | undefined; wear: WireWear } = { color: undefined, wear: { head: 0, face: 0, back: 0, pattern: 0 } },
  ) {
    this.registry = registry;
    this.connect = connect;
    this.name = name;
    this.look = look;
    this.mode = mode;
    this.spectating = spectate;
    this.open();
  }

  private open(): void {
    const s = this.connect();
    this.socket = s;
    s.onopen = () => {
      if (this.spectating) writeSpectate(this.writer.reset(), PROTOCOL_VERSION);
      else writeJoin(this.writer.reset(), { protocol: PROTOCOL_VERSION, name: this.name, token: this.token, color: this.look.color, wear: this.look.wear });
      s.send(this.writer.finish());
    };
    s.onmessage = (data) => this.receive(data);
    s.onclose = (clean) => this.onClose(clean);
  }

  close(reason = ''): void {
    if (this.state === 'closed') return;
    this.state = 'closed';
    this.reason = reason;
    this.socket?.close();
  }

  private onClose(clean: boolean): void {
    if (this.state === 'closed' || clean) {
      this.state = 'closed';
      return;
    }
    if (this.mode === 'online' && this.token && this.retries < MAX_RETRIES) {
      this.state = 'reconnecting';
      this.retries++;
      setTimeout(() => {
        if (this.state === 'reconnecting') this.open();
      }, 800 * this.retries);
      return;
    }
    this.state = 'closed';
    this.reason ||= this.welcome ? 'Lost the connection to the server.' : 'Could not reach the game server. Try again in a moment.';
  }

  /** Takes talent node `index` (registry order); the server checks it is open. */
  pick(index: number): void {
    if (this.state !== 'playing' || !this.self || this.self.pendingPicks <= 0) return;
    writePick(this.writer.reset(), index);
    this.socket?.send(this.writer.finish());
    this.stats.picks++;
  }

  private receive(data: Uint8Array): void {
    try {
      const r = new Reader(data);
      const type = r.u8();
      if (type === S2C.welcome) this.onWelcome(readWelcome(r));
      else if (type === S2C.snapshot) this.onSnapshot(readSnapshot(r, (kind) => kindRadius(this.registry, kind)));
      else if (type === S2C.roster) {
        this.roster.clear();
        for (const p of readRoster(r)) this.roster.set(p.id, p);
      } else if (type === S2C.scores) this.scores = readScores(r);
      else if (type === S2C.reject) this.close(r.str());
    } catch (err) {
      console.error('draft-arena: bad message from the server', err);
      this.close('The server sent something this page cannot read. Reload the page.');
    }
  }

  /** Coins and prestiges earned since the last call: the caller adds them to the profile. */
  takeEarnings(): { coins: number; prestiges: number } {
    const out = this.earned;
    this.earned = { coins: 0, prestiges: 0 };
    return out;
  }

  private onWelcome(w: WelcomeMsg): void {
    if (w.contentHash !== this.registry.hash) {
      this.outdated = true;
      this.close('This page is out of date: reload it to play.');
      return;
    }
    // A new player (the old one was gone too long): its counters start again.
    if (this.welcome && this.welcome.playerId !== w.playerId) this.coinsSeen = this.prestigeSeen = 0;
    this.welcome = w;
    this.token = w.token;
    this.state = 'playing';
    this.retries = 0;
    this.snaps = [];
    this.offset = undefined;
    this.paths.clear();
    this.fx = [];
    this.history = [];
    this.lastTarget = undefined;
  }

  private onSnapshot(s: WireSnapshot): void {
    const time = s.tick * TICK_MS;
    const sample = time - performance.now();
    if (this.offset === undefined) this.offset = sample;
    // Arriving sooner than expected means our estimate lags: catch up fast. Later: drift slowly.
    else if (sample > this.offset) this.offset += (sample - this.offset) * 0.25;
    else this.offset += (sample - this.offset) * 0.02;

    const byId = new Map<number, WireEntity>();
    for (const e of s.entities) byId.set(e.id, e);
    this.snaps.push({ s, time, byId });
    if (this.snaps.length > 60) this.snaps.splice(0, this.snaps.length - 60);

    for (const l of s.launches) {
      const k = this.registry.kinds[l.kind];
      if (!k || k.type !== 'projectile') continue;
      const start = l.tick * TICK_MS;
      this.paths.set(l.id, { launch: l, def: k.def, start, end: start + l.life * 1000 });
    }
    for (const id of s.removes) {
      const p = this.paths.get(id);
      if (p) p.end = Math.min(p.end, time);
    }
    for (const e of s.effects) {
      const def = this.registry.content.effects[e.kind];
      if (!def) continue;
      const seed = hashString(`${s.tick}:${e.kind}:${e.ax}:${e.ay}`);
      this.fx.push({ def, start: time, view: { ax: e.ax, ay: e.ay, bx: e.bx, by: e.by, value: e.value, t: 0, age: 0, seed } });
    }
    if (this.fx.length > 400) this.fx.splice(0, this.fx.length - 400);

    if (this.self?.alive && !s.self.alive) this.stats.deaths++;
    this.self = s.self;
    if (!this.spectating) {
      if (s.self.coins > this.coinsSeen) this.earned.coins += s.self.coins - this.coinsSeen;
      this.coinsSeen = Math.max(this.coinsSeen, s.self.coins);
      // Prestiges count up during a life and drop to 0 on a knockout.
      if (s.self.prestige > this.prestigeSeen) this.earned.prestiges += s.self.prestige - this.prestigeSeen;
      this.prestigeSeen = s.self.prestige;
    }
    this.history = this.history.filter((h) => seqNewer(h.seq, s.self.ackSeq));
    this.stats.snapshots++;
    this.stats.launches += s.launches.length;
    this.stats.effects += s.effects.length;
    this.stats.maxEntities = Math.max(this.stats.maxEntities, s.entities.length);
    let monsters = 0;
    for (const e of s.entities) if (this.registry.kinds[e.kind]?.type === 'monster') monsters++;
    this.stats.monstersInView = monsters;
  }

  /** Moves a point like the server moves a player: normalized input, clamped to the world. */
  private move(x: number, y: number, mx: number, my: number, distance: number): { x: number; y: number } {
    const len = Math.hypot(mx, my);
    if (len > 1) {
      mx /= len;
      my /= len;
    }
    const r = this.registry.content.rules.player.radius;
    const w = this.registry.content.rules.world;
    return { x: Math.min(w.width - r, Math.max(r, x + mx * distance)), y: Math.min(w.height - r, Math.max(r, y + my * distance)) };
  }

  /** Where your player is now: the server's position plus every input it hasn't applied yet. */
  private predict(mx: number, my: number): { x: number; y: number } | undefined {
    const self = this.self;
    if (!self || !self.alive) return undefined;
    let p = { x: self.x, y: self.y };
    for (const h of this.history) p = this.move(p.x, p.y, h.mx, h.my, self.speed * TICK_DT);
    return this.move(p.x, p.y, mx, my, self.speed * this.sendAccum);
  }

  /** Per frame: send inputs at the tick rate, then work out what to draw. */
  update(dt: number, input: InputState, nowMs: number): Frame | undefined {
    if (this.state !== 'playing' && this.state !== 'reconnecting') return undefined;
    const mx = quantize(input.moveX);
    const my = quantize(input.moveY);

    if (this.state === 'playing' && this.self && !this.spectating) {
      this.sendAccum += dt;
      let sent = 0;
      while (this.sendAccum >= TICK_DT && sent < 3) {
        this.seq = (this.seq + 1) & 0xffff;
        writeInput(this.writer.reset(), { seq: this.seq, moveX: mx, moveY: my, aim: input.aim, buttons: input.buttons });
        this.socket?.send(this.writer.finish());
        this.history.push({ seq: this.seq, mx, my });
        this.sendAccum -= TICK_DT;
        sent++;
      }
      if (this.sendAccum > TICK_DT * 3) this.sendAccum = 0;
      if (this.history.length > 40) this.history.splice(0, this.history.length - 40);
    }

    // Your player: prediction, with corrections eased in over ~0.1 s instead of jumping.
    const target = this.spectating ? undefined : this.predict(mx, my);
    if (target) {
      if (this.lastTarget && this.self) {
        const expected = this.move(this.lastTarget.x, this.lastTarget.y, mx, my, this.self.speed * dt);
        const cx = target.x - expected.x;
        const cy = target.y - expected.y;
        if (Math.hypot(cx, cy) > 150) {
          this.smoothX = 0;
          this.smoothY = 0;
        } else {
          this.smoothX -= cx;
          this.smoothY -= cy;
        }
      }
      const k = Math.exp(-dt * 10);
      this.smoothX *= k;
      this.smoothY *= k;
      this.lastTarget = target;
      this.me = { x: target.x + this.smoothX, y: target.y + this.smoothY };
    } else {
      this.lastTarget = undefined;
      this.smoothX = 0;
      this.smoothY = 0;
      this.me = undefined;
    }

    if (this.snaps.length === 0 || this.offset === undefined || !this.welcome) return undefined;
    const rt = nowMs + this.offset - INTERP_DELAY_MS;
    while (this.snaps.length > 2 && this.snaps[1]!.time <= rt - 500) this.snaps.shift();
    let a = this.snaps[0]!;
    let b: Snap | undefined;
    for (let i = 0; i < this.snaps.length; i++) {
      if (this.snaps[i]!.time <= rt) {
        a = this.snaps[i]!;
        b = this.snaps[i + 1];
      }
    }
    if (a.time > rt) b = undefined;
    const alpha = b ? Math.min(1, Math.max(0, (rt - a.time) / (b.time - a.time))) : 0;
    const myId = this.welcome.playerId;

    const entities: FrameEntity[] = [];
    const positions = new Map<number, { x: number; y: number }>();
    for (const e of (b ?? a).s.entities) {
      const prev = b ? a.byId.get(e.id) : undefined;
      const f: FrameEntity = { ...e, me: e.id === myId, speed: 0 };
      // A big jump between two snapshots is a teleport (a respawn, a moved monster): no sliding across.
      if (prev && b && prev.kind === e.kind && Math.abs(e.x - prev.x) + Math.abs(e.y - prev.y) < 300) {
        f.speed = (Math.hypot(e.x - prev.x, e.y - prev.y) * 1000) / Math.max(1, b.time - a.time);
        f.x = prev.x + (e.x - prev.x) * alpha;
        f.y = prev.y + (e.y - prev.y) * alpha;
        let da = e.angle - prev.angle;
        if (da > Math.PI) da -= Math.PI * 2;
        if (da < -Math.PI) da += Math.PI * 2;
        f.angle = prev.angle + da * alpha;
        f.radius = prev.radius + (e.radius - prev.radius) * alpha;
      }
      if (f.me && this.me) {
        f.x = this.me.x;
        f.y = this.me.y;
        f.speed = Math.min(1, Math.hypot(mx, my)) * (this.self?.speed ?? 0);
      }
      positions.set(f.id, f);
      entities.push(f);
    }

    const shots: FrameShot[] = [];
    for (const [id, shot] of this.paths) {
      if (rt >= shot.end) {
        this.paths.delete(id);
        continue;
      }
      if (rt < shot.start) continue;
      const t = (rt - shot.start) / 1000;
      const owner = shot.launch.owner === myId && this.me ? this.me : (positions.get(shot.launch.owner) ?? shot.launch);
      try {
        const at = this.pathAt(shot, t, owner);
        const before = this.pathAt(shot, Math.max(0, t - 0.03), owner);
        const moved = Math.hypot(at.x - before.x, at.y - before.y) > 0.01;
        shots.push({
          def: shot.def,
          x: at.x,
          y: at.y,
          angle: moved ? Math.atan2(at.y - before.y, at.x - before.x) : shot.launch.angle,
          speed: Math.hypot(at.x - before.x, at.y - before.y) / 0.03,
          seed: shot.launch.seed,
        });
      } catch (err) {
        this.paths.delete(id);
        this.reportOnce(shot.def, `${shot.def.id}.path`, err);
      }
    }

    const effects: { def: EffectDef; view: EffectView }[] = [];
    this.fx = this.fx.filter((f) => {
      const age = (rt - f.start) / 1000;
      if (age >= f.def.duration) return false;
      if (age >= 0) effects.push({ def: f.def, view: { ...f.view, age, t: age / f.def.duration } });
      return true;
    });

    let cam = this.me ?? (this.self ? { x: this.self.x, y: this.self.y } : (this.lastCam ?? { x: 0, y: 0 }));
    if (this.spectating && this.self) {
      // Follow the watched player as drawn (smooth), and glide over when the server switches to another.
      let best: FrameEntity | undefined;
      let bestD = Infinity;
      for (const e of entities) {
        if (this.registry.kinds[e.kind]?.type !== 'player') continue;
        const d = Math.hypot(e.x - this.self.x, e.y - this.self.y);
        if (d < bestD) {
          best = e;
          bestD = d;
        }
      }
      const goal = best ?? { x: this.self.x, y: this.self.y };
      const k = this.lastCam ? 1 - Math.exp(-dt * 6) : 1;
      const from = this.lastCam ?? goal;
      cam = { x: from.x + (goal.x - from.x) * k, y: from.y + (goal.y - from.y) * k };
    }
    this.lastCam = cam;
    return { time: nowMs / 1000, camX: cam.x, camY: cam.y, entities, shots, effects };
  }

  private pathAt(shot: PathShot, t: number, owner: { x: number; y: number }): { x: number; y: number } {
    const l = shot.launch;
    if (shot.def.path) return shot.def.path(l, t, { x: owner.x, y: owner.y });
    return { x: l.x + Math.cos(l.angle) * l.speed * t, y: l.y + Math.sin(l.angle) * l.speed * t };
  }

  /** Content that throws on the client is logged once and skipped from then on. */
  reportOnce(def: object, what: string, err: unknown): void {
    if (this.failed.has(def)) return;
    this.failed.add(def);
    console.error(`content error in ${what}: ${err instanceof Error ? err.message : String(err)}`);
  }
}
