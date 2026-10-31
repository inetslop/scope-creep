/**
 * The wire format, both directions, in one place so the writer and the reader can't drift apart.
 *
 * Every entity travels in the same fixed shape, whatever content it is: id, kind, position,
 * angle, radius, hp fraction, up to SLOT_COUNT generic numbers and a few status ids. The client
 * looks the kind up in the shared content registry to know how to draw it. That is why content
 * can grow without touching this file.
 *
 * Positions: uint16 of x * POS_SCALE. Angles: uint8 (entities) or uint16 (launches) of a full turn.
 */
import { MAX_STATUSES_SENT, MAX_WORLD, POS_SCALE, SLOT_COUNT } from '../config.ts';
import type { Reader, Writer } from './codec.ts';

/** Client to server. */
export const C2S = { join: 1, input: 2, pick: 3, spectate: 4 } as const;
/** Server to client. */
export const S2C = { welcome: 1, snapshot: 2, roster: 3, scores: 4, reject: 5 } as const;

const TAU = Math.PI * 2;

export const encodePos = (v: number): number => Math.round(Math.min(MAX_WORLD, Math.max(0, v)) * POS_SCALE);
export const decodePos = (v: number): number => v / POS_SCALE;
export const encodeAngle8 = (a: number): number => Math.round(((a % TAU) + TAU) % TAU / TAU * 256) & 0xff;
export const decodeAngle8 = (v: number): number => (v / 256) * TAU;
export const encodeAngle16 = (a: number): number => Math.round(((a % TAU) + TAU) % TAU / TAU * 65536) & 0xffff;
export const decodeAngle16 = (v: number): number => (v / 65536) * TAU;
const clampInt = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, Math.round(Number.isFinite(v) ? v : 0)));

// ---------------------------------------------------------------------------------------------
// Client to server

export interface JoinMsg {
  protocol: number;
  name: string;
  /** From an earlier WELCOME: rejoin as the same player after a dropped connection. Empty for a new player. */
  token: string;
}

export interface InputMsg {
  seq: number;
  /** -1..1 each; sent as int8. */
  moveX: number;
  moveY: number;
  /** Radians. */
  aim: number;
  /** Bit 1: ability A, bit 2: ability B. */
  buttons: number;
}

export function writeJoin(w: Writer, m: JoinMsg): void {
  w.u8(C2S.join);
  w.u8(m.protocol);
  w.str(m.name);
  w.str(m.token);
}

export function writeInput(w: Writer, m: InputMsg): void {
  w.u8(C2S.input);
  w.u16(m.seq & 0xffff);
  w.i8(clampInt(m.moveX * 127, -127, 127));
  w.i8(clampInt(m.moveY * 127, -127, 127));
  w.u16(encodeAngle16(m.aim));
  w.u8(m.buttons & 0xff);
}

/** Watch the match without playing (the start screen): snapshots follow the leader. */
export function writeSpectate(w: Writer, protocol: number): void {
  w.u8(C2S.spectate);
  w.u8(protocol);
}

/** Take talent node `index` (registry order). */
export function writePick(w: Writer, index: number): void {
  w.u8(C2S.pick);
  w.u16(index);
}

export function readJoin(r: Reader): JoinMsg {
  return { protocol: r.u8(), name: r.str(), token: r.str() };
}

export function readInput(r: Reader): InputMsg {
  return { seq: r.u16(), moveX: r.i8() / 127, moveY: r.i8() / 127, aim: decodeAngle16(r.u16()), buttons: r.u8() };
}

// ---------------------------------------------------------------------------------------------
// Server to client

export interface WelcomeMsg {
  protocol: number;
  playerId: number;
  token: string;
  tickRate: number;
  worldWidth: number;
  worldHeight: number;
  /** Hash of every content id in registry order: a client built from other content must reload. */
  contentHash: number;
}

export function writeWelcome(w: Writer, m: WelcomeMsg): void {
  w.u8(S2C.welcome);
  w.u8(m.protocol);
  w.u16(m.playerId);
  w.str(m.token);
  w.u8(m.tickRate);
  w.u16(m.worldWidth);
  w.u16(m.worldHeight);
  w.u32(m.contentHash >>> 0);
}

export function readWelcome(r: Reader): WelcomeMsg {
  return { protocol: r.u8(), playerId: r.u16(), token: r.str(), tickRate: r.u8(), worldWidth: r.u16(), worldHeight: r.u16(), contentHash: r.u32() };
}

export interface RosterEntry {
  id: number;
  name: string;
  /** Index into rules.playerColors. */
  color: number;
  bot: boolean;
}

export function writeRoster(w: Writer, players: readonly RosterEntry[]): void {
  w.u8(S2C.roster);
  w.u8(Math.min(255, players.length));
  for (const p of players.slice(0, 255)) {
    w.u16(p.id);
    w.str(p.name);
    w.u8(p.color);
    w.u8(p.bot ? 1 : 0);
  }
}

export function readRoster(r: Reader): RosterEntry[] {
  const n = r.u8();
  const out: RosterEntry[] = [];
  for (let i = 0; i < n; i++) out.push({ id: r.u16(), name: r.str(), color: r.u8(), bot: r.u8() === 1 });
  return out;
}

export interface ScoreEntry {
  id: number;
  score: number;
  level: number;
  kills: number;
}

export function writeScores(w: Writer, scores: readonly ScoreEntry[]): void {
  w.u8(S2C.scores);
  w.u8(Math.min(255, scores.length));
  for (const s of scores.slice(0, 255)) {
    w.u16(s.id);
    w.u32(clampInt(s.score, 0, 0xffffffff));
    w.u8(clampInt(s.level, 0, 255));
    w.u16(clampInt(s.kills, 0, 0xffff));
  }
}

export function readScores(r: Reader): ScoreEntry[] {
  const n = r.u8();
  const out: ScoreEntry[] = [];
  for (let i = 0; i < n; i++) out.push({ id: r.u16(), score: r.u32(), level: r.u8(), kills: r.u16() });
  return out;
}

export function writeReject(w: Writer, reason: string): void {
  w.u8(S2C.reject);
  w.str(reason);
}

// ---------------------------------------------------------------------------------------------
// Snapshot: self block, entities, then this tick's events

export interface WireSelf {
  alive: boolean;
  /** The last input seq the server applied: the client replays newer inputs on top of x/y. */
  ackSeq: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  xpNext: number;
  /** Current move speed (units/s, statuses included): the client predicts its own movement with it. */
  speed: number;
  kills: number;
  score: number;
  /** Seconds until respawn while dead. */
  respawnIn: number;
  pendingPicks: number;
  /** Ranks held, by talent index (registry order); talents with no rank are left out. */
  talents: { index: number; rank: number }[];
  upgrades: { index: number; level: number }[];
}

export interface WireEntity {
  id: number;
  kind: number;
  x: number;
  y: number;
  angle: number;
  radius: number;
  /** 0..1 */
  hp: number;
  /** Hit this tick or the last few: drawn with a flash. */
  flash: boolean;
  slots: number[];
  /** Status indexes. */
  statuses: number[];
}

export interface WireLaunch {
  id: number;
  kind: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  /** Entity id of whoever fired it (its position feeds path()). */
  owner: number;
  /** Server tick it was fired on. */
  tick: number;
  /** Seconds it flies (clients drop it then). */
  life: number;
  seed: number;
  p1: number;
  p2: number;
}

export interface WireEffect {
  kind: number;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  value: number;
}

export interface WireSnapshot {
  tick: number;
  self: WireSelf;
  entities: WireEntity[];
  launches: WireLaunch[];
  /** Path projectiles that ended early (they hit something): ids. */
  removes: number[];
  effects: WireEffect[];
}

export function writeSnapshotHead(w: Writer, tick: number, s: WireSelf): void {
  w.u8(S2C.snapshot);
  w.u32(tick);
  w.u8(s.alive ? 1 : 0);
  w.u16(s.ackSeq & 0xffff);
  w.u16(encodePos(s.x));
  w.u16(encodePos(s.y));
  w.u16(clampInt(Math.ceil(s.hp), 0, 0xffff));
  w.u16(clampInt(s.maxHp, 0, 0xffff));
  w.u8(clampInt(s.level, 0, 255));
  w.u32(clampInt(s.xp, 0, 0xffffffff));
  w.u32(clampInt(s.xpNext, 0, 0xffffffff));
  w.u16(clampInt(s.speed, 0, 0xffff));
  w.u16(clampInt(s.kills, 0, 0xffff));
  w.u32(clampInt(s.score, 0, 0xffffffff));
  w.u8(clampInt(s.respawnIn * 10, 0, 255));
  w.u8(clampInt(s.pendingPicks, 0, 255));
  w.u8(Math.min(255, s.talents.length));
  for (const t of s.talents.slice(0, 255)) {
    w.u16(t.index);
    w.u8(clampInt(t.rank, 0, 255));
  }
  w.u8(s.upgrades.length);
  for (const u of s.upgrades) {
    w.u16(u.index);
    w.u8(clampInt(u.level, 0, 255));
  }
}

/**
 * One entity: 10 bytes when it has no slots, statuses or special radius. `slots` may be shorter than
 * SLOT_COUNT; zero slots aren't sent. The radius is only sent when it differs from the kind's default.
 */
export function writeEntity(
  w: Writer,
  id: number,
  kind: number,
  x: number,
  y: number,
  angle: number,
  radius: number,
  defaultRadius: number,
  hpFraction: number,
  flash: boolean,
  slots: readonly number[],
  statuses: readonly number[],
): void {
  w.u16(id);
  w.u8(kind);
  w.u16(encodePos(x));
  w.u16(encodePos(y));
  w.u8(encodeAngle8(angle));
  w.u8(clampInt(hpFraction * 255, 0, 255));
  let flags = flash ? 0x20 : 0;
  for (let i = 0; i < SLOT_COUNT; i++) if (slots[i]) flags |= 1 << i;
  const statusCount = Math.min(statuses.length, MAX_STATUSES_SENT);
  if (statusCount > 0) flags |= 0x10;
  const ownRadius = Math.abs(radius - defaultRadius) >= 1;
  if (ownRadius) flags |= 0x40;
  w.u8(flags);
  for (let i = 0; i < SLOT_COUNT; i++) if (flags & (1 << i)) w.i16(clampInt(slots[i]!, -32768, 32767));
  if (statusCount > 0) {
    w.u8(statusCount);
    for (let i = 0; i < statusCount; i++) w.u8(statuses[i]!);
  }
  if (ownRadius) w.u16(clampInt(radius * 4, 0, 0xffff));
}

export function writeLaunch(w: Writer, l: WireLaunch): void {
  w.u16(l.id);
  w.u16(l.kind);
  w.u16(encodePos(l.x));
  w.u16(encodePos(l.y));
  w.u16(encodeAngle16(l.angle));
  w.u16(clampInt(l.speed, 0, 0xffff));
  w.u16(l.owner);
  w.u32(l.tick);
  w.u16(clampInt(l.life * 100, 0, 0xffff));
  w.u16(l.seed & 0xffff);
  w.i16(clampInt(l.p1, -32768, 32767));
  w.i16(clampInt(l.p2, -32768, 32767));
}

export function writeEffect(w: Writer, e: WireEffect): void {
  w.u16(e.kind);
  w.u16(encodePos(e.ax));
  w.u16(encodePos(e.ay));
  w.u16(encodePos(e.bx));
  w.u16(encodePos(e.by));
  w.i16(clampInt(e.value, -32768, 32767));
}

/** Reads a whole snapshot (the S2C.snapshot type byte already read). `radiusOf` gives a kind's default radius. */
export function readSnapshot(r: Reader, radiusOf: (kind: number) => number): WireSnapshot {
  const tick = r.u32();
  const self: WireSelf = {
    alive: r.u8() === 1,
    ackSeq: r.u16(),
    x: decodePos(r.u16()),
    y: decodePos(r.u16()),
    hp: r.u16(),
    maxHp: r.u16(),
    level: r.u8(),
    xp: r.u32(),
    xpNext: r.u32(),
    speed: r.u16(),
    kills: r.u16(),
    score: r.u32(),
    respawnIn: r.u8() / 10,
    pendingPicks: r.u8(),
    talents: [],
    upgrades: [],
  };
  const talentCount = r.u8();
  for (let i = 0; i < talentCount; i++) self.talents.push({ index: r.u16(), rank: r.u8() });
  const upgradeCount = r.u8();
  for (let i = 0; i < upgradeCount; i++) self.upgrades.push({ index: r.u16(), level: r.u8() });

  const entities: WireEntity[] = [];
  const entityCount = r.u16();
  for (let i = 0; i < entityCount; i++) {
    const e: WireEntity = {
      id: r.u16(),
      kind: r.u8(),
      x: decodePos(r.u16()),
      y: decodePos(r.u16()),
      angle: decodeAngle8(r.u8()),
      radius: 0,
      hp: r.u8() / 255,
      flash: false,
      slots: [0, 0, 0, 0],
      statuses: [],
    };
    const flags = r.u8();
    e.flash = (flags & 0x20) !== 0;
    for (let s = 0; s < SLOT_COUNT; s++) if (flags & (1 << s)) e.slots[s] = r.i16();
    if (flags & 0x10) {
      const n = r.u8();
      for (let s = 0; s < n; s++) e.statuses.push(r.u8());
    }
    e.radius = flags & 0x40 ? r.u16() / 4 : radiusOf(e.kind);
    entities.push(e);
  }

  const launches: WireLaunch[] = [];
  const launchCount = r.u16();
  for (let i = 0; i < launchCount; i++) {
    launches.push({
      id: r.u16(),
      kind: r.u16(),
      x: decodePos(r.u16()),
      y: decodePos(r.u16()),
      angle: decodeAngle16(r.u16()),
      speed: r.u16(),
      owner: r.u16(),
      tick: r.u32(),
      life: r.u16() / 100,
      seed: r.u16(),
      p1: r.i16(),
      p2: r.i16(),
    });
  }
  const removes: number[] = [];
  const removeCount = r.u16();
  for (let i = 0; i < removeCount; i++) removes.push(r.u16());
  const effects: WireEffect[] = [];
  const effectCount = r.u16();
  for (let i = 0; i < effectCount; i++) {
    effects.push({ kind: r.u16(), ax: decodePos(r.u16()), ay: decodePos(r.u16()), bx: decodePos(r.u16()), by: decodePos(r.u16()), value: r.i16() });
  }
  return { tick, self, entities, launches, removes, effects };
}
