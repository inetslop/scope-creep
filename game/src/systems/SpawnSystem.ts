import Phaser from 'phaser';
import { Sfx } from '../audio/Sfx';
import { UNDERDRAW } from '../config';
import { ENEMIES, getEnemy } from '../content/enemies';
import type { EnemyDef } from '../content/types';
import { SpawnDirector } from '../core/director';
import { enemyHpScale } from '../core/progression';
import type { RunState } from '../core/run';
import { SLAM } from '../core/slam';
import { normalize, type Vec2 } from '../core/vec';
import { hook } from '../debug/testHook';
import { Enemy } from '../entities/Enemy';
import { EnemyBullet } from '../entities/EnemyBullet';
import type { Player } from '../entities/Player';
import { FxSystem } from './FxSystem';
import { Marginalia } from './Marginalia';
import { PuddleSystem } from './PuddleSystem';
import { Underdrawing } from './Underdrawing';

const MAX_ENEMIES = 260;
const MAX_ENEMY_SHOTS = 200;
const ENEMY_SHOT_SPEED = 150;
const ENEMY_SHOT_DAMAGE = 8;
const ENEMY_SHOT_LIFE = 12;

/** Spawns enemies just outside the view (director decides what/when) and steers them. */
export class SpawnSystem {
  readonly enemies: Phaser.Physics.Arcade.Group;
  readonly enemyShots: Phaser.Physics.Arcade.Group;
  private readonly director = new SpawnDirector(ENEMIES);
  private readonly scene: Phaser.Scene;
  private readonly run: RunState;
  private readonly player: Player;
  private readonly bounds: Phaser.Geom.Rectangle;
  private readonly marginalia: Marginalia;
  private readonly underdrawing: Underdrawing;
  private readonly fx: FxSystem;
  private readonly sfx: Sfx;
  private readonly puddles: PuddleSystem;
  private readonly pending: { def: EnemyDef; elite: boolean; x: number; y: number; at: number }[] = [];

  constructor(scene: Phaser.Scene, run: RunState, player: Player, bounds: Phaser.Geom.Rectangle, marginalia: Marginalia, underdrawing: Underdrawing, fx: FxSystem, sfx: Sfx, puddles: PuddleSystem) {
    this.scene = scene;
    this.run = run;
    this.player = player;
    this.bounds = bounds;
    this.marginalia = marginalia;
    this.underdrawing = underdrawing;
    this.fx = fx;
    this.sfx = sfx;
    this.puddles = puddles;
    this.enemies = scene.physics.add.group({ classType: Enemy, maxSize: MAX_ENEMIES, runChildUpdate: false });
    this.enemyShots = scene.physics.add.group({ classType: EnemyBullet, maxSize: MAX_ENEMY_SHOTS, runChildUpdate: false });
  }

  get maxEnemies(): number {
    return MAX_ENEMIES;
  }

  get activeCount(): number {
    return this.enemies.countActive(true);
  }

  get activeShotCount(): number {
    return this.enemyShots.countActive(true);
  }

  get maxEnemyShots(): number {
    return MAX_ENEMY_SHOTS;
  }

  update(dt: number): void {
    // The director pauses while the boss is alive. The gate must wrap both the
    // director tick and the spawn loop, or the threat budget accumulates during
    // the fight and bursts on resume.
    if (!this.run.bossAlive) {
      const { ids, elites } = this.director.update(dt, this.run.timeSec, this.activeCount + this.pending.length, this.run.rng);
      for (const id of ids) this.announce(getEnemy(id), false);
      for (const id of elites) this.announce(getEnemy(id), true);
    }
    this.releaseDue();
    const target = this.aimTarget();
    for (const obj of this.enemies.getChildren()) {
      const e = obj as Enemy;
      if (!e.active) continue;
      e.steer(target, dt);
      if (e.consumeShot()) this.fireShot(e);
      if (e.consumeSlam()) this.performSlam(e);
      if (e.consumeQuickenPuff()) this.performQuickenPuff(e);
      if (e.consumePuddle() && e.def.puddle) this.puddles.drop(e.x, e.y, e.serial, e.def.puddle);
    }
    for (const obj of this.enemyShots.getChildren()) {
      const p = obj as EnemyBullet;
      if (!p.active) continue;
      p.lifeLeft -= dt;
      if (p.lifeLeft <= 0 || !this.bounds.contains(p.x, p.y)) p.despawn();
    }
  }

  spawn(def: EnemyDef, at?: { x: number; y: number }, elite?: boolean, hpScale?: number): Enemy | null {
    const pos = at ?? this.pickSpawnPoint();
    const enemy = this.enemies.get(pos.x, pos.y) as Enemy | null;
    if (!enemy) return null;
    enemy.spawn(def, pos.x, pos.y, hpScale ?? enemyHpScale(this.run.timeSec), this.run.rng, elite ?? false);
    if (this.run.firstSighting(def.id)) this.marginalia.note(enemy, def);
    hook.stats.enemiesSpawned += 1;
    if (elite) hook.stats.elitesSpawned += 1;
    return enemy;
  }

  /** One director decision. Before UNDERDRAW.atSec this is exactly today's spawn; after, the spot is
   *  fixed now and sketched, and the spawn lands leadSec later via releaseDue(). Bosses, split
   *  children and minions call spawn() directly, so they are never underdrawn. */
  private announce(def: EnemyDef, elite: boolean): void {
    if (this.run.timeSec < UNDERDRAW.atSec) { this.spawn(def, undefined, elite); return; } // pre-8:00: identical to today
    const pos = this.pickSpawnPoint(); // spot fixed at announcement, so the sketch never moves
    this.pending.push({ def, elite, x: pos.x, y: pos.y, at: this.run.timeSec + UNDERDRAW.leadSec });
    this.underdrawing.sketch(def, elite, pos.x, pos.y);
  }

  /** Lands announced spawns whose lead has elapsed. A null from a full pool is final: the sketch
   *  fades out with no enemy, and the schedule never retries. */
  private releaseDue(): void {
    for (let i = this.pending.length - 1; i >= 0; i--) {
      const p = this.pending[i]!;
      if (this.run.timeSec < p.at) continue;
      this.pending.splice(i, 1);
      this.spawn(p.def, { x: p.x, y: p.y }, p.elite); // null from a full pool: sketch just fades out, no enemy
    }
  }

  /** Fires one slow ink dart from (x, y) at `angle` (The Frame's burst). Reuses the enemy-shot pool. */
  fireDart(x: number, y: number, angle: number): void {
    const p = this.enemyShots.get(x, y) as EnemyBullet | null;
    if (!p) return;
    p.fire(x, y, angle, ENEMY_SHOT_SPEED, ENEMY_SHOT_DAMAGE, ENEMY_SHOT_LIFE);
  }

  /** Where enemies steer and shoot: the player. */
  private aimTarget(): Vec2 {
    return { x: this.player.x, y: this.player.y };
  }

  /** Fires one slow ink point from `e` at the current aim target. */
  private fireShot(e: Enemy): void {
    const p = this.enemyShots.get(e.x, e.y) as EnemyBullet | null;
    if (!p) return;
    const target = this.aimTarget();
    const angle = Math.atan2(target.y - e.y, target.x - e.x);
    const speed = e.def.shoot?.speed ?? ENEMY_SHOT_SPEED;
    const damage = e.def.shoot?.damage ?? ENEMY_SHOT_DAMAGE;
    p.fire(e.x, e.y, angle, speed, damage, ENEMY_SHOT_LIFE);
  }

  /**
   * A Platen's slam: a zero-damage radial shove. The player takes a full impulse
   * away from the Platen; every other enemy in the radius is shoved with the
   * enemy impulse through hit(), so knockbackResist still applies (a Platen
   * shrugs off half, an elite is immovable).
   */
  private performSlam(e: Enemy): void {
    const r2 = SLAM.radius * SLAM.radius;
    const px = this.player.x - e.x, py = this.player.y - e.y;
    if (!this.run.isDead && px * px + py * py <= r2) this.player.knockback(normalize({ x: px, y: py }), SLAM.playerKnock);
    for (const obj of this.enemies.getChildren()) {
      const o = obj as Enemy;
      if (!o.active || o === e) continue;
      const dx = o.x - e.x, dy = o.y - e.y;
      if (dx * dx + dy * dy <= r2) o.hit(0, e, SLAM.enemyKnock);
    }
    this.fx.slamRing(e.x, e.y);
    this.fx.slamDust(e.x, e.y, this.run.rng);
    this.sfx.slam();
  }

  /** A Hare quickened: an ink puff pops behind it, opposite its travel (stationary: random rear). */
  private performQuickenPuff(e: Enemy): void {
    const v = (e.body as Phaser.Physics.Arcade.Body).velocity;
    const rear = (Math.hypot(v.x, v.y) > 1 ? Math.atan2(v.y, v.x) : this.run.rng.range(0, Math.PI * 2)) + Math.PI;
    this.fx.quickenPuff(e.x, e.y, rear, this.run.rng);
  }

  /** A point on a ring just outside the camera view, inside the arena. */
  private pickSpawnPoint(): { x: number; y: number } {
    const view = this.scene.cameras.main.worldView;
    const ring = Math.hypot(view.width, view.height) / 2 + 60;
    const margin = 40;
    const inner = new Phaser.Geom.Rectangle(this.bounds.x + margin, this.bounds.y + margin, this.bounds.width - margin * 2, this.bounds.height - margin * 2);
    for (let attempt = 0; attempt < 8; attempt++) {
      const a = this.run.rng.range(0, Math.PI * 2);
      const x = this.player.x + Math.cos(a) * ring;
      const y = this.player.y + Math.sin(a) * ring;
      if (inner.contains(x, y)) return { x, y };
    }
    // Player is hugging a wall: clamp a random ring point into the arena.
    const a = this.run.rng.range(0, Math.PI * 2);
    return {
      x: Phaser.Math.Clamp(this.player.x + Math.cos(a) * ring, inner.left, inner.right),
      y: Phaser.Math.Clamp(this.player.y + Math.sin(a) * ring, inner.top, inner.bottom),
    };
  }
}
