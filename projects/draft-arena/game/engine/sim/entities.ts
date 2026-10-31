/**
 * The simulation's own view of the objects content sees through engine/api.ts: the same objects,
 * plus the engine's bookkeeping. `cat` tells them apart in the grids and the snapshot writer.
 */
import type { Area, AreaDef, Launch, Monster, MonsterDef, PickupDef, Player, PlayerInput, Projectile, ProjectileDef, Stats, StatusDef, TalentDef, UpgradeDef } from '../api.ts';

export interface WearIndexes {
  head: number;
  face: number;
  back: number;
  pattern: number;
}

export const NO_WEAR: Readonly<WearIndexes> = { head: 0, face: 0, back: 0, pattern: 0 };

export interface StatusState {
  def: StatusDef;
  index: number;
  stacks: number;
  left: number;
}

interface UnitBookkeeping {
  kind: number;
  /** Removed at the end of the tick. */
  dead: boolean;
  hp: number;
  maxHp: number;
  statuses: StatusState[];
  /** Id of the last player that hit it, and when: who gets the kill. */
  lastHitBy: number;
  lastHitAt: number;
  /** Drawn flashing until this tick. */
  flashUntil: number;
}

export interface BotBrain {
  wanderAngle: number;
  wanderIn: number;
  pickIn: number;
  /** The direction it is actually moving: eased toward what the forces want, never snapped. */
  moveX: number;
  moveY: number;
  /** The talent tree this life commits to (chosen afresh after every knockout). */
  favorite: string;
}

export interface SimPlayer extends Player, UnitBookkeeping {
  cat: 'player';
  type: 'player';
  alive: boolean;
  name: string;
  bot: boolean;
  /** Index into rules.playerColors. */
  color: number;
  /** What the player wears: index + 1 in content.accessories per slot and in content.patterns; 0: nothing. */
  wear: WearIndexes;
  token: string;
  level: number;
  /** Prestiges this life. */
  prestige: number;
  /** Coins given since the player joined (ctx.giveCoins): the client adds the difference to its profile. */
  coins: number;
  xp: number;
  xpNext: number;
  kills: number;
  score: number;
  stats: Stats;
  input: PlayerInput;
  upgrades: Map<UpgradeDef, { level: number; timer: number }>;
  /** Ranks held in each talent, the free start ranks included. */
  talents: Map<TalentDef, number>;
  /** Talent points banked: one per level gained. */
  pendingPicks: number;
  respawnAt: number;
  ackSeq: number;
  /** False while a human's connection is gone (kept for RECONNECT_GRACE_S). */
  connected: boolean;
  leftAt: number;
  brain: BotBrain | undefined;
}

export interface SimMonster extends Monster, UnitBookkeeping {
  cat: 'monster';
  type: 'monster';
  alive: boolean;
  def: MonsterDef;
  target: SimPlayer | undefined;
  retargetIn: number;
}

export type SimUnit = SimPlayer | SimMonster;

export interface SimProjectile extends Projectile {
  cat: 'projectile';
  kind: number;
  def: ProjectileDef;
  owner: SimUnit;
  age: number;
  /** Tick it was fired on: its age is counted from here, exactly like the clients count it. */
  born: number;
  launch: Launch;
  /** Moved by path() (or straight): clients compute it from the launch. Else step(), sent every tick. */
  scripted: boolean;
  /** Units already hit: each at most once. */
  hits: Set<number>;
  dead: boolean;
}

export interface SimArea extends Area {
  cat: 'area';
  kind: number;
  def: AreaDef;
  owner: SimUnit;
  age: number;
  timer: number;
  follow: boolean;
  dead: boolean;
}

export interface SimPickup {
  cat: 'pickup';
  id: number;
  kind: number;
  def: PickupDef;
  x: number;
  y: number;
  angle: number;
  radius: number;
  value: number;
  age: number;
  life: number;
  dead: boolean;
  slots: number[];
  /** The nearest player pulling it in this tick. */
  target: SimPlayer | undefined;
  targetD2: number;
}

/** Everything sent in snapshots. */
export type SimVisible = SimPlayer | SimMonster | SimProjectile | SimArea | SimPickup;
