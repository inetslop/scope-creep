import Phaser from 'phaser';
import type { RunState } from '../core/run';
import type { Boss } from '../entities/Boss';
import type { Enemy } from '../entities/Enemy';
import type { EnemyBullet } from '../entities/EnemyBullet';

/**
 * The physics side of the fermata (core/fermata.ts): while the hold is active,
 * every enemy and enemy-bullet body is zeroed and the boss body's velocity is
 * parked in a ledger, so patterns resume exactly where they left off.
 * Enemies get no ledger entry: SpawnSystem.steer() re-sets their velocity on
 * the first unfrozen frame, so restoring theirs risks writing a killed parent's
 * old velocity onto a pooled object reused as a split child.
 */
export class FermataSystem {
  private readonly saved = new Map<object, { x: number; y: number }>();
  private frozen = false;
  private readonly run: RunState;

  constructor(run: RunState) {
    this.run = run;
  }

  get savedCount(): number {
    return this.saved.size;
  }

  /** Advances the hold; true while the shapes are still. */
  update(dt: number, enemies: Phaser.Physics.Arcade.Group, enemyShots: Phaser.Physics.Arcade.Group, boss: Boss): boolean {
    if (this.run.fermata.active && !this.frozen) this.freeze(enemies, enemyShots, boss);
    this.run.fermata.update(dt);
    if (!this.run.fermata.active && this.frozen) this.release();
    this.frozen = this.run.fermata.active;
    return this.run.fermata.active;
  }

  private freeze(enemies: Phaser.Physics.Arcade.Group, enemyShots: Phaser.Physics.Arcade.Group, boss: Boss): void {
    for (const obj of enemies.getChildren()) {
      const e = obj as Enemy;
      if (e.active) e.setVelocity(0, 0);
    }
    for (const obj of enemyShots.getChildren()) {
      const p = obj as EnemyBullet;
      if (!p.active) continue;
      const b = p.body as Phaser.Physics.Arcade.Body;
      this.saved.set(p, { x: b.velocity.x, y: b.velocity.y });
      p.setVelocity(0, 0);
    }
    if (boss.active) {
      const b = boss.body as Phaser.Physics.Arcade.Body;
      this.saved.set(boss, { x: b.velocity.x, y: b.velocity.y });
      boss.setVelocity(0, 0);
    }
  }

  private release(): void {
    for (const [obj, v] of this.saved) {
      const s = obj as Phaser.Physics.Arcade.Sprite;
      if (s.active && s.body && s.body.enable) s.setVelocity(v.x, v.y);
    }
    this.saved.clear();
  }
}
