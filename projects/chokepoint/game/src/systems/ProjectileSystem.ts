import type Phaser from 'phaser';
import { CELL, PIERCE_REACH } from '../config';
import { pickPierceTarget } from '../core/targeting';
import type { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import type { EnemySystem, HitPayload } from './EnemySystem';

/** Owns the projectile pool: homing bolts, and the straight pellets of a Spray's blast. */
export class ProjectileSystem {
  private readonly scene: Phaser.Scene;
  private readonly enemies: EnemySystem;
  private readonly pool: Projectile[] = [];
  /** The number of this run's latest blast (pellets carry it; the per-blast push guard reads it). */
  private blastSeq = 0;
  /** Per enemy: the number of the last blast that pushed it (an enemy is pushed at most once per blast). */
  private readonly pushed = new Map<Enemy, number>();

  constructor(scene: Phaser.Scene, enemies: EnemySystem) {
    this.scene = scene;
    this.enemies = enemies;
  }

  get activeCount(): number {
    let n = 0;
    for (const p of this.pool) if (p.active) n++;
    return n;
  }

  /** The next pooled projectile: out of the pool, or a fresh one. */
  private take(): Projectile {
    let p = this.pool.find((q) => !q.active);
    if (!p) {
      p = new Projectile(this.scene);
      this.scene.add.existing(p);
      this.pool.push(p);
    }
    return p;
  }

  fire(x: number, y: number, target: Enemy, payload: HitPayload, speed: number, asTracer = false): void {
    this.take().fire(x, y, target, payload, speed, asTracer);
  }

  /** A Spray's blast: `count` pellets from (x, y) in a 50-degree cone centred on the aim at `target`, each flying straight to `maxDist` board units. */
  fireCone(x: number, y: number, target: Enemy, count: number, payload: HitPayload, speed: number, maxDist: number): void {
    const blast = ++this.blastSeq;
    const a0 = Math.atan2(target.x - x, target.y - y);
    const half = (50 * Math.PI) / 180 / 2;
    for (let i = 0; i < count; i++) {
      const a = count > 1 ? a0 - half + (2 * half * i) / (count - 1) : a0;
      this.take().firePellet(x, y, Math.sin(a), Math.cos(a), payload, speed, maxDist, blast);
    }
  }

  update(dt: number): void {
    for (const p of this.pool) {
      if (!p.active) continue;
      if (!p.straight && p.lost) {
        p.despawn();
        continue;
      }
      if (p.straight) {
        // A pellet strikes the first enemy its path touches this frame; touching nothing, it runs out of road.
        const fromX = p.x;
        const fromY = p.y;
        const done = p.advance(dt);
        const i = this.touching(p, fromX, fromY);
        if (i >= 0) this.settle(p, this.enemies.all[i]!);
        else if (done) p.despawn();
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
    const flight = { x: p.fx, y: p.fy };
    const next = payload.pierce > 0 ? pickPierceTarget(target, this.enemies.all, PIERCE_REACH * CELL) : -1;
    if (next < 0) {
      this.enemies.hit(target, payload, flight);
      p.despawn();
      return;
    }
    const x = target.x;
    const y = target.y;
    this.enemies.strike(target, payload, flight); // no burst yet: the shot keeps going
    p.fire(x, y, this.enemies.all[next]!, { ...payload, pierce: payload.pierce - 1 }, p.speed);
  }

  /** A pellet that touched an enemy: it strikes it; with pierce the pellet keeps going along its own line. */
  private settle(p: Projectile, enemy: Enemy): void {
    const payload = p.payload!;
    const flight = { x: p.fx, y: p.fy };
    let pay = payload;
    if (payload.push > 0) {
      // Push: an enemy is pushed at most once per blast, however many pellets of it hit it.
      const seen = this.pushed.get(enemy) === p.blast;
      this.pushed.set(enemy, p.blast);
      if (seen) pay = { ...payload, push: 0 };
    }
    if (payload.pierce > 0) {
      this.enemies.strike(enemy, pay, flight); // no burst yet: the pellet keeps going
      p.skip.push(enemy);
      p.payload = { ...payload, pierce: payload.pierce - 1 };
      return;
    }
    this.enemies.hit(enemy, pay, flight);
    p.despawn();
  }

  /** The first enemy whose token this pellet's path touches this frame (already-struck ones skipped), or -1. */
  private touching(p: Projectile, fromX: number, fromY: number): number {
    for (let i = 0; i < this.enemies.all.length; i++) {
      const e = this.enemies.all[i]!;
      if (!e.active || p.skip.includes(e)) continue;
      if (pathTouches(p, fromX, fromY, e)) return i;
    }
    return -1;
  }

  /** Invariant: an active projectile that has been flying for over 5s is stuck. */
  brokenProjectile(): string | undefined {
    const stuck = this.pool.find((p) => p.active && p.age > 5);
    return stuck ? `a projectile has been flying for ${stuck.age.toFixed(1)}s` : undefined;
  }
}

/** Whether the pellet's path (fromX, fromY) to its new spot touches the enemy's token: the closest point on the path to the token's centre. */
function pathTouches(p: Projectile, fromX: number, fromY: number, e: Enemy): boolean {
  const r = e.def.look.size * CELL;
  const dx = p.x - fromX;
  const dy = p.y - fromY;
  const len2 = dx * dx + dy * dy;
  const t = len2 > 0 ? Math.max(0, Math.min(1, ((e.x - fromX) * dx + (e.y - fromY) * dy) / len2)) : 0;
  const cx = fromX + t * dx - e.x;
  const cy = fromY + t * dy - e.y;
  return cx * cx + cy * cy <= r * r;
}
