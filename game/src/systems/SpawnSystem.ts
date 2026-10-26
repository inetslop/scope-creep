import Phaser from 'phaser';
import { ENEMIES, getEnemy } from '../content/enemies';
import type { EnemyDef } from '../content/types';
import { SpawnDirector } from '../core/director';
import { enemyHpScale } from '../core/progression';
import type { RunState } from '../core/run';
import { hook } from '../debug/testHook';
import { Enemy } from '../entities/Enemy';
import { EnemyBullet } from '../entities/EnemyBullet';
import type { Player } from '../entities/Player';
import { Marginalia } from './Marginalia';

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

  constructor(scene: Phaser.Scene, run: RunState, player: Player, bounds: Phaser.Geom.Rectangle, marginalia: Marginalia) {
    this.scene = scene;
    this.run = run;
    this.player = player;
    this.bounds = bounds;
    this.marginalia = marginalia;
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
    const ids = this.director.update(dt, this.run.timeSec, this.activeCount, this.run.rng);
    for (const id of ids) this.spawn(getEnemy(id));
    const target = { x: this.player.x, y: this.player.y };
    for (const obj of this.enemies.getChildren()) {
      const e = obj as Enemy;
      if (!e.active) continue;
      e.steer(target, dt);
      if (e.consumeShot()) this.fireShot(e);
    }
    for (const obj of this.enemyShots.getChildren()) {
      const p = obj as EnemyBullet;
      if (!p.active) continue;
      p.lifeLeft -= dt;
      if (p.lifeLeft <= 0 || !this.bounds.contains(p.x, p.y)) p.despawn();
    }
  }

  spawn(def: EnemyDef, at?: { x: number; y: number }): Enemy | null {
    const pos = at ?? this.pickSpawnPoint();
    const enemy = this.enemies.get(pos.x, pos.y) as Enemy | null;
    if (!enemy) return null;
    enemy.spawn(def, pos.x, pos.y, enemyHpScale(this.run.timeSec), this.run.rng);
    if (this.run.firstSighting(def.id)) this.marginalia.note(enemy, def);
    hook.stats.enemiesSpawned += 1;
    return enemy;
  }

  /** Fires one slow ink point from `e` at the player's current position. */
  private fireShot(e: Enemy): void {
    const p = this.enemyShots.get(e.x, e.y) as EnemyBullet | null;
    if (!p) return;
    const angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
    const speed = e.def.shoot?.speed ?? ENEMY_SHOT_SPEED;
    const damage = e.def.shoot?.damage ?? ENEMY_SHOT_DAMAGE;
    p.fire(e.x, e.y, angle, speed, damage, ENEMY_SHOT_LIFE);
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
