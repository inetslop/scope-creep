import Phaser from 'phaser';
import { ENEMIES, getEnemy } from '../content/enemies';
import type { EnemyDef } from '../content/types';
import { SpawnDirector } from '../core/director';
import { enemyHpScale } from '../core/progression';
import type { RunState } from '../core/run';
import { hook } from '../debug/testHook';
import { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';

const MAX_ENEMIES = 260;

/** Spawns enemies just outside the view (director decides what/when) and steers them. */
export class SpawnSystem {
  readonly enemies: Phaser.Physics.Arcade.Group;
  private readonly director = new SpawnDirector(ENEMIES);
  private readonly scene: Phaser.Scene;
  private readonly run: RunState;
  private readonly player: Player;
  private readonly bounds: Phaser.Geom.Rectangle;

  constructor(scene: Phaser.Scene, run: RunState, player: Player, bounds: Phaser.Geom.Rectangle) {
    this.scene = scene;
    this.run = run;
    this.player = player;
    this.bounds = bounds;
    this.enemies = scene.physics.add.group({ classType: Enemy, maxSize: MAX_ENEMIES, runChildUpdate: false });
  }

  get maxEnemies(): number {
    return MAX_ENEMIES;
  }

  get activeCount(): number {
    return this.enemies.countActive(true);
  }

  update(dt: number): void {
    const ids = this.director.update(dt, this.run.timeSec, this.activeCount, this.run.rng);
    for (const id of ids) this.spawn(getEnemy(id));
    const target = { x: this.player.x, y: this.player.y };
    for (const obj of this.enemies.getChildren()) {
      const e = obj as Enemy;
      if (e.active) e.steer(target, dt);
    }
  }

  spawn(def: EnemyDef, at?: { x: number; y: number }): Enemy | null {
    const pos = at ?? this.pickSpawnPoint();
    const enemy = this.enemies.get(pos.x, pos.y) as Enemy | null;
    if (!enemy) return null;
    enemy.spawn(def, pos.x, pos.y, enemyHpScale(this.run.timeSec), this.run.rng);
    hook.stats.enemiesSpawned += 1;
    return enemy;
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
