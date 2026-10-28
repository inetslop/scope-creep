import type Phaser from 'phaser';
import { CELL, PIERCE_REACH } from '../config';
import { PALETTE } from '../content/palette';
import { LEAD_HIT_RADIUS } from '../core/lead';
import { pickPierceTarget } from '../core/targeting';
import type { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import type { EnemySystem, HitPayload } from './EnemySystem';
import type { FxSystem } from './FxSystem';

/** Owns the bolt pool: flying, hitting, and fizzling when the target is gone. */
export class ProjectileSystem {
  private readonly scene: Phaser.Scene;
  private readonly enemies: EnemySystem;
  private readonly fx: FxSystem;
  private readonly pool: Projectile[] = [];

  constructor(scene: Phaser.Scene, enemies: EnemySystem, fx: FxSystem) {
    this.scene = scene;
    this.enemies = enemies;
    this.fx = fx;
  }

  get activeCount(): number {
    let n = 0;
    for (const p of this.pool) if (p.active) n++;
    return n;
  }

  fire(x: number, y: number, target: Enemy, payload: HitPayload, speed: number, aimX?: number, aimY?: number): void {
    let p = this.pool.find((q) => !q.active);
    if (!p) {
      p = new Projectile(this.scene);
      this.scene.add.existing(p);
      this.pool.push(p);
    }
    p.fire(x, y, target, payload, speed, aimX, aimY);
  }

  update(dt: number): void {
    for (const p of this.pool) {
      if (!p.active) continue;
      if (p.lost) {
        p.despawn();
        continue;
      }
      if (p.advance(dt)) this.land(p);
    }
  }

  /**
   * A shot that reached its target: with pierce it strikes the enemy (no burst: the shot is not
   * done yet) and keeps going at the closest enemy behind it; without, it hits (bursting with
   * splash) and despawns.
   */
  private land(p: Projectile): void {
    const target = p.target!;
    const payload = p.payload!;
    // An aimed shot landed but the enemy is out of reach of the impact point: it fizzles ahead
    // of it (a small quiet gray puff, no damage, no sound).
    if (p.aimX !== undefined && Math.hypot(target.x - p.x, target.y - p.y) > LEAD_HIT_RADIUS * CELL) {
      this.fx.wave(p.x, p.y, 14, PALETTE.faint);
      p.despawn();
      return;
    }
    const next = payload.pierce > 0 ? pickPierceTarget(target, this.enemies.all, PIERCE_REACH * CELL) : -1;
    if (next < 0) {
      this.enemies.hit(target, payload);
      p.despawn();
      return;
    }
    const x = target.x;
    const y = target.y;
    this.enemies.strike(target, payload); // no burst yet: the shot keeps going
    p.fire(x, y, this.enemies.all[next]!, { ...payload, pierce: payload.pierce - 1 }, p.speed);
  }

  /** Invariant: an active projectile that has been flying for over 5s is stuck. */
  brokenProjectile(): string | undefined {
    const stuck = this.pool.find((p) => p.active && p.age > 5);
    return stuck ? `a projectile has been flying for ${stuck.age.toFixed(1)}s` : undefined;
  }

  /** Invariant: an active aimed shot must fly to a finite impact point. */
  brokenAim(): string | undefined {
    const broken = this.pool.find((p) => p.active && p.aimX !== undefined && (p.aimY === undefined || !Number.isFinite(p.aimX) || !Number.isFinite(p.aimY)));
    return broken ? 'an aimed shot flies to a non-finite point' : undefined;
  }
}
