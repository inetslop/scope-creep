import type Phaser from 'phaser';
import type { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import type { EnemySystem, HitPayload } from './EnemySystem';

/** Owns the bolt pool: flying, hitting, and fizzling when the target is gone. */
export class ProjectileSystem {
  private readonly scene: Phaser.Scene;
  private readonly enemies: EnemySystem;
  private readonly pool: Projectile[] = [];

  constructor(scene: Phaser.Scene, enemies: EnemySystem) {
    this.scene = scene;
    this.enemies = enemies;
  }

  get activeCount(): number {
    let n = 0;
    for (const p of this.pool) if (p.active) n++;
    return n;
  }

  fire(x: number, y: number, target: Enemy, payload: HitPayload, speed: number): void {
    let p = this.pool.find((q) => !q.active);
    if (!p) {
      p = new Projectile(this.scene);
      this.scene.add.existing(p);
      this.pool.push(p);
    }
    p.fire(x, y, target, payload, speed);
  }

  update(dt: number): void {
    for (const p of this.pool) {
      if (!p.active) continue;
      if (p.lost) {
        p.despawn();
        continue;
      }
      if (p.advance(dt)) {
        this.enemies.hit(p.target!, p.payload!);
        p.despawn();
      }
    }
  }
}
