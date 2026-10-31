/**
 * The content API: the only engine file game code (src/) may import (lint enforced).
 *
 * The engine owns what goes over the network; content owns behavior. Everything here is either a
 * definition the engine reads (MonsterDef, UpgradeDef, ProjectileDef, ...), a live object content
 * hooks get handed (Player, Monster, Projectile, ...), or a helper. Hooks run on the server only,
 * except `path()` (projectiles), `look.draw()` and effect `draw()`, which run on every client too.
 * A hook that throws disables its item for the rest of the match instead of crashing it.
 */
import type { Rng } from './shared/rng.ts';

import { noise } from './shared/rng.ts';

export type { Rng } from './shared/rng.ts';
export { noise } from './shared/rng.ts';
export { SLOT_COUNT } from './config.ts';

export interface Point {
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------------------------
// Looks

export type Shape = 'circle' | 'triangle' | 'square' | 'diamond' | 'pentagon' | 'hexagon' | 'star';
export const SHAPES: readonly Shape[] = ['circle', 'triangle', 'square', 'diamond', 'pentagon', 'hexagon', 'star'];

/**
 * A critter's face. Monsters get an angry one and players a happy one unless their look says
 * otherwise; projectiles, areas and pickups have none unless given one.
 */
export interface Face {
  /** angry: slanted brows. happy: rosy cheeks. calm: plain eyes. scared: tiny pupils, raised brows. */
  mood?: 'angry' | 'happy' | 'calm' | 'scared';
  /** 1 (one big eye), 2 (default) or 3. */
  eyes?: 1 | 2 | 3;
  mouth?: 'none' | 'o' | 'smile' | 'frown' | 'teeth';
}

export const MOODS: readonly NonNullable<Face['mood']>[] = ['angry', 'happy', 'calm', 'scared'];
export const MOUTHS: readonly NonNullable<Face['mouth']>[] = ['none', 'o', 'smile', 'frown', 'teeth'];

/**
 * What every client draws for an entity of this kind, in the Critters style: the shape as a squishy
 * body in its color with an ink outline and a soft shadow, a face on creatures, stretching more the
 * faster it moves.
 */
export interface Look {
  shape: Shape;
  /** '#rrggbb', from src/content/palette.ts. */
  color: string;
  /** Drawn size relative to the radius (default 1). */
  scale?: number;
  /** The face (see Face), or false for none. */
  face?: Face | false;
  /**
   * Draw it yourself instead. Runs on the client every frame, in world units, with the origin moved
   * to the entity (so draw around 0,0). Read synced state from e.slots. To keep the style, start
   * with drawCritter(g, look, e, ...) and draw your extras on top.
   */
  draw?: (g: CanvasRenderingContext2D, e: DrawView) => void;
}

export interface DrawView {
  x: number;
  y: number;
  angle: number;
  radius: number;
  /** 0..1 */
  hp: number;
  /** The entity's slots, as content set them on the server. */
  slots: readonly number[];
  /** Hit in the last few ticks. */
  flash: boolean;
  /** How fast it is moving (units per second, as drawn). */
  speed: number;
  /** Client clock in seconds: animate with it. */
  time: number;
  /** Stable per entity: feed it to noise() for variation. */
  seed: number;
  color: string;
}

// ---------------------------------------------------------------------------------------------
// Live objects (server side)

interface Body {
  readonly id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Radians. Drawn as the facing. */
  angle: number;
  radius: number;
  /**
   * SLOT_COUNT numbers sent to every client that sees this entity: the way to show content state
   * (a charge, a shield, stacks) without touching the network code. Whole numbers -32768..32767
   * (store a fraction times 100).
   */
  readonly slots: number[];
  /** Free memory for content hooks. Server only, never sent. */
  readonly mem: Record<string, number>;
}

interface UnitBase extends Body {
  hp: number;
  maxHp: number;
  /** 0 for monsters; a player's own id for the player and everything it fires. */
  readonly team: number;
  readonly alive: boolean;
}

export interface Player extends UnitBase {
  readonly type: 'player';
  readonly name: string;
  readonly bot: boolean;
  readonly level: number;
  readonly stats: Readonly<Stats>;
  readonly input: Readonly<PlayerInput>;
}

export interface Monster extends UnitBase {
  readonly type: 'monster';
  readonly def: MonsterDef;
  /** Units per second (from the def, scaled by nothing yet). */
  speed: number;
  /** Damage per second to a player it touches. */
  damage: number;
  /** The nearest player, re-chosen by the engine twice a second. */
  readonly target: Player | undefined;
}

export type Unit = Player | Monster;

export interface Projectile extends Body {
  readonly def: ProjectileDef;
  readonly owner: Unit;
  readonly team: number;
  damage: number;
  speed: number;
  /** Hits left. */
  pierce: number;
  /** Seconds since launch. */
  readonly age: number;
  life: number;
  readonly launch: Launch;
}

export interface Area extends Body {
  readonly def: AreaDef;
  readonly owner: Unit;
  readonly team: number;
  /** Damage of one strike (ctx.strike). */
  damage: number;
  readonly age: number;
  life: number;
}

export interface Stats {
  maxHp: number;
  /** Units per second. */
  speed: number;
  /** Hp per second. */
  regen: number;
  /** Multiplies all damage you deal (1 = normal). */
  damage: number;
  /** Multiplies every weapon's cooldown (1 = normal, 0.8 = 20% faster). Never below 0.25. */
  cooldown: number;
  /** Multiplies area radii. */
  area: number;
  /** Multiplies projectile speed. */
  projectileSpeed: number;
  /** Pickups within this distance fly to you. */
  pickup: number;
  /** Taken off every hit you take (a hit never drops below a quarter of itself). */
  armor: number;
  /** Added to the pierce of every projectile you fire (enemies it can hit before it is gone). */
  pierce: number;
  /** Extra copies of every projectile you fire, fanned out around its angle. */
  shots: number;
}

/** Added to a player's stats once per level of the upgrade: { speed: 20 } is +20 speed per level. */
export type StatBonus = Partial<Stats>;

export interface PlayerInput {
  /** -1..1 */
  moveX: number;
  moveY: number;
  /** Radians, where the mouse points (the move direction on touch). */
  aim: number;
  /** Bit 1: ability A (Space), bit 2: ability B. */
  buttons: number;
}

/** What a projectile was launched with: all a path() gets, so every client can compute it too. */
export interface Launch {
  readonly x: number;
  readonly y: number;
  readonly angle: number;
  readonly speed: number;
  /** Random per projectile, the same everywhere: use it with noise() for variation. */
  readonly seed: number;
  /** Two free numbers from ctx.fire (whole numbers -32768..32767). */
  readonly p1: number;
  readonly p2: number;
}

export interface LaunchOptions {
  /** Default: the owner's position. */
  x?: number;
  y?: number;
  angle: number;
  /** Units per second, before the owner's projectileSpeed stat (default 400). */
  speed?: number;
  /** Before the owner's damage stat. */
  damage: number;
  /** Default: the def's pierce, else 1. */
  pierce?: number;
  /** Seconds. Default: the def's life. */
  life?: number;
  p1?: number;
  p2?: number;
}

export interface AreaOptions {
  x?: number;
  y?: number;
  /** Default: the def's radius. Times the owner's area stat. */
  radius?: number;
  /** Default: the def's life. */
  life?: number;
  /** One strike's damage, before the owner's damage stat. */
  damage?: number;
  /** Default: the def's follow. */
  follow?: boolean;
}

export interface Hit {
  target: Unit;
  /** What was really dealt. */
  damage: number;
  x: number;
  y: number;
  projectile?: Projectile;
  area?: Area;
}

/** What hooks can ask and do. Server only. */
export interface Ctx {
  /** Seconds since the match started. */
  readonly time: number;
  readonly rng: Rng;
  readonly rules: Rules;
  isEnemy(a: { team: number }, b: { team: number }): boolean;
  /** The nearest living enemy of `of` within range. */
  nearestEnemy(of: Point & { team: number }, range: number): Unit | undefined;
  enemiesNear(of: { team: number }, x: number, y: number, radius: number): Unit[];
  unitsNear(x: number, y: number, radius: number): Unit[];
  fire(owner: Unit, projectileId: string, opts: LaunchOptions): void;
  area(owner: Unit, areaId: string, opts?: AreaOptions): void;
  /** Plain damage: no on-hit hooks. `by` gets the credit for a kill. */
  damage(target: Unit, amount: number, by?: Unit): number;
  /** A projectile's or area's hit: its damage, then every on-hit hook (projectile def, owner's upgrades). */
  strike(source: Projectile | Area, target: Unit): void;
  heal(target: Unit, amount: number): void;
  addStatus(target: Unit, statusId: string, seconds: number, stacks?: number): void;
  /** Stacks of a status on a unit (0 = none). */
  statusOf(target: Unit, statusId: string): number;
  /** A one-shot visual on every client that can see it. */
  effect(effectId: string, a: Point, b?: Point, value?: number): void;
  /** Every living player. */
  players(): Player[];
  /** A living player by id (e.g. one kept in a unit's mem), to credit damage dealt later. */
  playerById(id: number): Player | undefined;
  spawnMonster(monsterId: string, x: number, y: number): Monster | undefined;
  dropPickup(pickupId: string, x: number, y: number, value: number): void;
  giveXp(player: Player, amount: number): void;
}

// ---------------------------------------------------------------------------------------------
// Definitions (content)

export interface MonsterDef {
  id: string;
  name: string;
  description: string;
  hp: number;
  /** Units per second. */
  speed: number;
  radius: number;
  /** Damage per second to a player it touches. */
  damage: number;
  /** Value of the gem it drops. */
  xp: number;
  /** How often it spawns compared with the others (0: only through ctx.spawnMonster). */
  weight: number;
  /** It spawns around players of at least this level. */
  fromLevel: number;
  look: Look;
  /** Every tick, instead of chase(): set m.vx/m.vy (units/s) and the engine moves it (slows apply). */
  think?: (ctx: Ctx, m: Monster, dt: number) => void;
  onDeath?: (ctx: Ctx, m: Monster) => void;
}

export interface ProjectileDef {
  id: string;
  radius: number;
  /** Seconds. */
  life: number;
  /** Enemies it can hit before it is gone (default 1). It hits each enemy once. */
  pierce?: number;
  look: Look;
  /**
   * Where it is t seconds after launch, from the launch alone (and the owner's current position).
   * Runs on the server and on every client, so only the launch is sent: use it for anything fired
   * in numbers. Must be pure: no ctx, no Math.random, no state; the same inputs give the same point.
   */
  path?: (s: Launch, t: number, owner: Point) => Point;
  /**
   * Moves it one tick, on the server only: anything goes (homing, bouncing...). Its position is sent
   * every tick like a monster's, which costs bandwidth: use it for few projectiles. Move it yourself
   * (moveForward and turnToward help). With neither path nor step it flies straight.
   */
  step?: (ctx: Ctx, p: Projectile, dt: number) => void;
  onHit?: (ctx: Ctx, p: Projectile, target: Unit) => void;
  /** When its life runs out (not when its hits are used up). */
  onEnd?: (ctx: Ctx, p: Projectile) => void;
}

export interface AreaDef {
  id: string;
  radius: number;
  /** Seconds. */
  life: number;
  /** Seconds between pulses; the first pulse comes at once. */
  interval: number;
  /** Stays centred on its owner (and ends when the owner dies). */
  follow?: boolean;
  look: Look;
  pulse: (ctx: Ctx, a: Area) => void;
}

export interface UpgradeDef {
  id: string;
  name: string;
  /** What it does, and what each level adds (shown on its talents in the panel). */
  description: string;
  /** Levels it can reach; its talents add up to at most this many ranks. */
  maxLevel: number;
  look: Look;
  /** Added to the player's stats per level. */
  stats?: StatBonus;
  /** Seconds between fire() calls (times the player's cooldown stat). With fire, it is a weapon. */
  cooldown?: number;
  fire?: (ctx: Ctx, me: Player, level: number) => void;
  /** After every hit by this player's projectiles and areas (not plain ctx.damage). */
  onHit?: (ctx: Ctx, me: Player, level: number, hit: Hit) => void;
  onKill?: (ctx: Ctx, me: Player, level: number, victim: Unit) => void;
}

export interface StatusDef {
  id: string;
  name: string;
  /** The ring drawn around a unit that has it. */
  color: string;
  /** Movement multiplier while it lasts. */
  speedMul?: number;
  /** Default 1. */
  maxStacks?: number;
  tick?: (ctx: Ctx, u: Unit, dt: number, stacks: number) => void;
}

export interface PickupDef {
  id: string;
  radius: number;
  /** Seconds before it disappears. */
  life: number;
  look: Look;
  collect: (ctx: Ctx, p: Player, value: number) => void;
}

/**
 * A talent tree: one playstyle. Players spend a point per level on any talent whose needs are met,
 * in any tree. Each tree has its own shape: it comes only from what its talents need.
 */
export interface TalentTreeDef {
  id: string;
  name: string;
  /** One line under the tree's name: the playstyle. */
  description: string;
  /** The tree's icon on its tab. */
  look: Look;
  /** One per line. A talent is drawn under the first talent it needs. */
  talents: readonly TalentDef[];
}

/**
 * One talent: every rank gives one level of its upgrade. It can be taken when everything in
 * `needs` holds and its tree has `points` spent in it.
 */
export interface TalentDef {
  id: string;
  /** The upgrade each rank gives a level of (its name, look and text are the talent's). */
  upgrade: string;
  /** Ranks it can take (at most the upgrade's maxLevel). */
  max: number;
  /** Other talents in the same tree and the rank each must have: [['pierce', 2]]. */
  needs?: readonly (readonly [string, number])[];
  /** Points spent in this tree first. */
  points?: number;
  /** Ranks every player starts with, free (the nomad's Bolt). */
  start?: number;
}

/**
 * Something that runs the whole match rather than one item: field events, elites, bounties. Server
 * only. `mem` is this director's own memory for the match (starts empty): keep its state there,
 * never in module variables (a new match must start fresh).
 */
export interface DirectorDef {
  id: string;
  name: string;
  description: string;
  /** Every tick. */
  tick?: (ctx: Ctx, mem: Record<string, number>, dt: number) => void;
  /** After every death, monster or player. `killer` is the player credited, if any. */
  onKill?: (ctx: Ctx, mem: Record<string, number>, killer: Player | undefined, victim: Unit) => void;
}

/** A one-shot visual. Client only. */
export interface EffectDef {
  id: string;
  /** Seconds. */
  duration: number;
  /** In world units (not moved to a point: use fx.ax/fx.ay). */
  draw: (g: CanvasRenderingContext2D, fx: EffectView) => void;
}

export interface EffectView {
  ax: number;
  ay: number;
  /** Second point (same as a when none was given). */
  bx: number;
  by: number;
  value: number;
  /** 0 → 1 over the duration. */
  t: number;
  /** Seconds since it started. */
  age: number;
  seed: number;
}

export interface Rules {
  world: { width: number; height: number };
  /** The color of the playfield ('#rrggbb'). */
  ground: string;
  /** Outlines, eyes and text ('#rrggbb'). */
  ink: string;
  player: { maxHp: number; speed: number; radius: number; pickup: number; regen: number };
  respawnSeconds: number;
  /** XP to reach level 2; every level after needs `growth` times more (rounded up). */
  xp: { first: number; growth: number };
  spawn: {
    /** Seconds between spawn passes. */
    every: number;
    /** Monsters wanted around a level 1 player, and how many more per level. */
    base: number;
    perLevel: number;
    max: number;
    /** At most this many per player per pass. */
    burst: number;
    minDistance: number;
    maxDistance: number;
    /**
     * A monster this far from the nearest player (out of everyone's sight) is moved to a spawn spot
     * ahead of that player instead of trailing behind: crowds stay in front, not in a growing tail.
     */
    relocateDistance: number;
    maxMonsters: number;
  };
  /** Monster hp grows by this fraction per level of the player it spawned around. */
  monsterHpPerLevel: number;
  /** Pickup dropped by monsters, worth their xp. */
  gem: string;
  maxPickups: number;
  effects: { death: string; levelUp: string; playerDeath: string };
  score: { monsterKill: number; playerKill: number };
  pvp: { damageMul: number; bountyXpPerLevel: number };
  bots: { fillTo: number; names: readonly string[] };
  playerColors: readonly string[];
}

export interface Content {
  monsters: readonly MonsterDef[];
  projectiles: readonly ProjectileDef[];
  areas: readonly AreaDef[];
  upgrades: readonly UpgradeDef[];
  statuses: readonly StatusDef[];
  pickups: readonly PickupDef[];
  effects: readonly EffectDef[];
  directors: readonly DirectorDef[];
  /** The talent trees, one per line (each in its own file). */
  trees: readonly TalentTreeDef[];
  rules: Rules;
}

// ---------------------------------------------------------------------------------------------
// HUD (client side): src/hud/ parts get this view

export interface HudMe {
  name: string;
  color: string;
  alive: boolean;
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  xpNext: number;
  kills: number;
  score: number;
  respawnIn: number;
  /** Talent points banked: one per level gained, spent whenever you like. */
  pendingPicks: number;
  /** Every tree, and where you stand with each talent in it. */
  trees: readonly HudTree[];
  upgrades: readonly { def: UpgradeDef; level: number }[];
}

export interface HudTree {
  def: TalentTreeDef;
  /** Points spent in it (free start ranks don't count). */
  spent: number;
  talents: readonly HudTalent[];
}

export interface HudTalent {
  def: TalentDef;
  upgrade: UpgradeDef;
  rank: number;
  /** can: you can take a rank now. open: needs met, but no point to spend. maxed. locked: see missing. */
  state: 'can' | 'open' | 'maxed' | 'locked';
  /** What it still needs, ready to show: "Bolt 2", "4 pts in Gunner". */
  missing: readonly string[];
}

export interface HudScore {
  name: string;
  color: string;
  score: number;
  level: number;
  kills: number;
  me: boolean;
  bot: boolean;
}

export interface HudView {
  mode: 'online' | 'offline';
  /** '' when all is well, else what the connection is doing ("Reconnecting…"). */
  status: string;
  /** The last input was a touch: show tap hints instead of keys. */
  touch: boolean;
  me: HudMe | undefined;
  /** Best first. */
  scores: readonly HudScore[];
  playerCount: number;
  /** Take a rank of a talent (when its state is 'can'). */
  pick(talentId: string): void;
}

/** One HUD element: build its DOM in the factory (append to root), refresh it in update(). */
export interface HudPart {
  /** Called every frame: only touch the DOM when what you show has changed. */
  update(view: HudView): void;
}

export type MakeHudPart = (root: HTMLElement) => HudPart;

// ---------------------------------------------------------------------------------------------
// Helpers

export const v = {
  add: (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y }),
  sub: (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y }),
  scale: (a: Point, k: number): Point => ({ x: a.x * k, y: a.y * k }),
  len: (a: Point): number => Math.hypot(a.x, a.y),
  dist: (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y),
  /** Unit vector at an angle, times length. */
  fromAngle: (angle: number, length = 1): Point => ({ x: Math.cos(angle) * length, y: Math.sin(angle) * length }),
  /** Angle from a to b. */
  angleTo: (a: Point, b: Point): number => Math.atan2(b.y - a.y, b.x - a.x),
  /** a turned a quarter turn (left of a direction, in screen coordinates). */
  perp: (a: Point): Point => ({ x: -a.y, y: a.x }),
};

/** Straight flight: where a launch is after t seconds. */
export function along(s: Launch, t: number): Point {
  return { x: s.x + Math.cos(s.angle) * s.speed * t, y: s.y + Math.sin(s.angle) * s.speed * t };
}

/** Moves a step() projectile along its angle at its speed. */
export function moveForward(p: Projectile, dt: number): void {
  p.x += Math.cos(p.angle) * p.speed * dt;
  p.y += Math.sin(p.angle) * p.speed * dt;
}

/** Turns b toward a point by at most maxTurn radians. */
export function turnToward(b: { x: number; y: number; angle: number }, target: Point, maxTurn: number): void {
  const want = Math.atan2(target.y - b.y, target.x - b.x);
  let diff = want - b.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  b.angle += Math.max(-maxTurn, Math.min(maxTurn, diff));
}

/**
 * The default monster behavior: head for the target at full speed (stand still without one). Each
 * monster comes in at its own angle while it is far (up to 40 degrees off the straight line, less
 * as it closes in), so a crowd fans out and surrounds instead of queuing into one blob behind you.
 */
export function chase(m: Monster): void {
  const t = m.target;
  if (!t) {
    m.vx = 0;
    m.vy = 0;
    return;
  }
  const d = Math.hypot(t.x - m.x, t.y - m.y);
  const spread = (noise(m.id, 1) - 0.5) * 1.4 * Math.min(1, Math.max(0, (d - 120) / 500));
  const a = Math.atan2(t.y - m.y, t.x - m.x) + spread;
  m.vx = Math.cos(a) * m.speed;
  m.vy = Math.sin(a) * m.speed;
  m.angle = a;
}

/** A '#rrggbb' color mixed toward black (amount < 0) or white (amount > 0), -1..1. */
export function shade(color: string, amount: number): string {
  const n = parseInt(color.slice(1), 16);
  const mix = (c: number): number => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Adds a shape's outline around 0,0 to the current path (call beginPath first, then fill). */
export function traceShape(g: CanvasRenderingContext2D, shape: Shape, r: number, angle = 0): void {
  if (shape === 'circle') {
    g.arc(0, 0, r, 0, Math.PI * 2);
    return;
  }
  const corners: Record<Exclude<Shape, 'circle'>, number> = { triangle: 3, square: 4, diamond: 4, pentagon: 5, hexagon: 6, star: 10 };
  const n = corners[shape];
  const start = shape === 'square' ? Math.PI / 4 : shape === 'diamond' ? 0 : -Math.PI / 2;
  const size = shape === 'square' ? r * 1.25 : shape === 'triangle' ? r * 1.2 : r;
  for (let i = 0; i < n; i++) {
    const a = angle + start + (i / n) * Math.PI * 2;
    const rr = shape === 'star' && i % 2 === 1 ? size * 0.5 : size;
    if (i === 0) g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  g.closePath();
}

export interface CritterOptions {
  /** Outline and eye color: rules.ink. */
  ink: string;
  /** Without one, no face is drawn. */
  face?: Face;
  /** A small white shine (candy, gems). */
  glint?: boolean;
}

/**
 * Draws a look Critters-style around 0,0: a soft shadow, the shape as a squishy body (it wobbles
 * more the faster it moves), an ink outline, a white flash when hit, and the face if there is one.
 * The engine draws every look this way; a look's own draw() can call it and add extras on top.
 */
export function drawCritter(g: CanvasRenderingContext2D, look: Look, e: DrawView, opts: CritterOptions): void {
  const r = e.radius * (look.scale ?? 1);
  const turn = look.shape === 'circle' ? 0 : e.angle + Math.PI / 2;
  g.fillStyle = 'rgba(40, 30, 70, 0.13)';
  g.beginPath();
  g.ellipse(0, r * 0.82, r * 0.9, r * 0.3, 0, 0, Math.PI * 2);
  g.fill();
  const moving = Math.min(1, e.speed / 200);
  const squash = Math.sin(e.time * (5 + 6 * moving) + e.seed * 1.7) * (0.03 + 0.06 * moving);
  g.save();
  g.scale(1 + squash, 1 - squash);
  g.beginPath();
  traceShape(g, look.shape, r, turn);
  g.fillStyle = e.flash ? '#ffffff' : look.color;
  g.fill();
  g.lineJoin = 'round';
  g.lineWidth = Math.max(1.5, Math.min(3, r * 0.2));
  g.strokeStyle = opts.ink;
  g.stroke();
  if (opts.glint) {
    g.fillStyle = 'rgba(255, 255, 255, 0.75)';
    g.beginPath();
    g.ellipse(-r * 0.28, -r * 0.34, r * 0.22, r * 0.13, -0.6, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
  if (opts.face) drawFace(g, opts.face, r, e.angle, opts.ink);
}

/** Eyes that look along `angle`, brows or cheeks for the mood, and a mouth, around 0,0. */
export function drawFace(g: CanvasRenderingContext2D, face: Face, r: number, angle: number, ink: string): void {
  const count = face.eyes ?? 2;
  const mood = face.mood ?? 'calm';
  const eyeR = r * (count === 1 ? 0.36 : count === 3 ? 0.21 : 0.26);
  const xs = count === 1 ? [0] : count === 3 ? [-0.44, 0, 0.44] : [-0.34, 0.34];
  const lx = Math.cos(angle);
  const ly = Math.sin(angle);
  const pupil = mood === 'scared' ? 0.32 : 0.5;
  g.lineCap = 'round';
  for (let i = 0; i < xs.length; i++) {
    const ex = xs[i]! * r;
    const ey = -r * (count === 3 && i === 1 ? 0.3 : 0.12);
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(ex, ey, eyeR, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = ink;
    g.beginPath();
    g.arc(ex + lx * eyeR * 0.4, ey + ly * eyeR * 0.4, eyeR * pupil, 0, Math.PI * 2);
    g.fill();
    const side = ex === 0 ? 1 : Math.sign(ex);
    if (mood === 'angry' || mood === 'scared') {
      // Angry brows slant down toward the middle of the face (\ /); scared ones up (/ \).
      const drop = mood === 'angry' ? r * 0.12 : -r * 0.08;
      const browY = ey - eyeR * 1.45;
      g.strokeStyle = ink;
      g.lineWidth = Math.max(1.5, r * 0.11);
      g.beginPath();
      g.moveTo(ex + side * eyeR * 0.95, browY);
      g.lineTo(ex - side * eyeR * 0.7, browY + drop);
      g.stroke();
    }
  }
  if (mood === 'happy') {
    g.fillStyle = 'rgba(255, 120, 150, 0.45)';
    for (const side of [-1, 1]) {
      g.beginPath();
      g.arc(side * r * 0.56, r * 0.22, r * 0.14, 0, Math.PI * 2);
      g.fill();
    }
  }
  const my = r * 0.42;
  g.strokeStyle = ink;
  g.fillStyle = ink;
  g.lineWidth = Math.max(1.5, r * 0.1);
  switch (face.mouth ?? 'none') {
    case 'o':
      g.beginPath();
      g.arc(0, my, r * 0.13, 0, Math.PI * 2);
      g.fill();
      break;
    case 'smile':
      g.beginPath();
      g.arc(0, my - r * 0.12, r * 0.2, 0.2 * Math.PI, 0.8 * Math.PI);
      g.stroke();
      break;
    case 'frown':
      g.beginPath();
      g.arc(0, my + r * 0.12, r * 0.2, 1.2 * Math.PI, 1.8 * Math.PI);
      g.stroke();
      break;
    case 'teeth': {
      const w = r * 0.5;
      const h = r * 0.2;
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.rect(-w / 2, my - h / 2, w, h);
      g.fill();
      g.stroke();
      g.beginPath();
      for (let i = 1; i < 4; i++) {
        g.moveTo(-w / 2 + (w * i) / 4, my - h / 2);
        g.lineTo(-w / 2 + (w * i) / 4, my + h / 2);
      }
      g.stroke();
      break;
    }
    default:
      break;
  }
}

/** Paints a look into a small canvas (an upgrade icon on a card), Critters-style. */
export function paintIcon(canvas: HTMLCanvasElement, look: Look, ink: string): void {
  const g = canvas.getContext('2d');
  if (!g) return;
  const r = Math.min(canvas.width, canvas.height) * 0.33;
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.save();
  g.translate(canvas.width / 2, canvas.height / 2 - r * 0.1);
  const view: DrawView = { x: 0, y: 0, angle: -Math.PI / 2, radius: r, hp: 1, slots: [0, 0, 0, 0], flash: false, speed: 0, time: 0, seed: 0, color: look.color };
  drawCritter(g, look, view, { ink, face: look.face || undefined, glint: !look.face });
  g.restore();
}
