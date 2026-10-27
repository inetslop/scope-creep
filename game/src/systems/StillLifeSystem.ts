import type Phaser from 'phaser';
import type { Sfx } from '../audio/Sfx';
import { TEX } from '../art/textures';
import { DEPTH } from '../config';
import { BUBBLE_RADIUS, SLOW_FACTOR, StillLife } from '../core/stillLife';
import { hook } from '../debug/testHook';
import type { Boss } from '../entities/Boss';
import type { Enemy } from '../entities/Enemy';
import type { EnemyBullet } from '../entities/EnemyBullet';
import type { Player } from '../entities/Player';

/**
 * Still Life: for 5 s a bubble around the player in which everything enemy —
 * enemies, enemy shots, the boss — moves at half speed. Only the velocity is
 * re-scaled; attack timers run on real dt and are untouched, so pattern timing
 * is unchanged. Must run after SpawnSystem and BossSystem, which write the
 * velocities this frame.
 */
export class StillLifeSystem {
  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemies: Phaser.Physics.Arcade.Group;
  private readonly enemyShots: Phaser.Physics.Arcade.Group;
  private readonly boss: Boss;
  private readonly sfx: Sfx;
  private readonly timing = new StillLife();
  private readonly disc: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, player: Player, enemies: Phaser.Physics.Arcade.Group, enemyShots: Phaser.Physics.Arcade.Group, boss: Boss, sfx: Sfx) {
    this.scene = scene;
    this.player = player;
    this.enemies = enemies;
    this.enemyShots = enemyShots;
    this.boss = boss;
    this.sfx = sfx;
    this.disc = scene.add.image(0, 0, TEX.bubble).setDepth(DEPTH.bubble).setVisible(false);
  }

  get active(): boolean {
    return this.timing.active;
  }

  get ready(): boolean {
    return this.timing.ready;
  }

  get cooldownFrac(): number {
    return this.timing.cooldownFrac;
  }

  /** Raises the bubble around the player. False while cooling or while an overlay is up. */
  trigger(): boolean {
    if (!this.scene.sys.isActive() || !this.timing.trigger()) return false;
    this.disc.setPosition(this.player.x, this.player.y).setVisible(true);
    hook.stats.stillLifeActivations += 1;
    this.sfx.bubbleOn();
    return true;
  }

  /** Ages the bubble; while up it follows the player and halves everything inside. */
  update(dt: number): void {
    const ended = this.timing.update(dt);
    if (this.timing.active) {
      this.disc.setPosition(this.player.x, this.player.y);
      this.applySpeeds(true);
    } else if (ended) {
      this.disc.setVisible(false);
      this.applySpeeds(false);
    }
  }

  /** Shots re-apply base x factor each frame; enemies and the boss halve the velocity written this frame. */
  private applySpeeds(slow: boolean): void {
    const r2 = BUBBLE_RADIUS * BUBBLE_RADIUS;
    const px = this.player.x;
    const py = this.player.y;
    const inside = (x: number, y: number): boolean => (x - px) * (x - px) + (y - py) * (y - py) <= r2;
    for (const obj of this.enemies.getChildren()) {
      const e = obj as Enemy;
      if (!e.active || !slow || !inside(e.x, e.y)) continue;
      const body = e.body as Phaser.Physics.Arcade.Body;
      e.setVelocity(body.velocity.x * SLOW_FACTOR, body.velocity.y * SLOW_FACTOR);
    }
    for (const obj of this.enemyShots.getChildren()) {
      const p = obj as EnemyBullet;
      if (!p.active) continue;
      const f = slow && inside(p.x, p.y) ? SLOW_FACTOR : 1;
      p.setVelocity(p.baseVx * f, p.baseVy * f);
    }
    const b = this.boss;
    if (b.active && slow && inside(b.x, b.y)) {
      const body = b.body as Phaser.Physics.Arcade.Body;
      b.setVelocity(body.velocity.x * SLOW_FACTOR, body.velocity.y * SLOW_FACTOR);
    }
  }
}
