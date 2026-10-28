import Phaser from 'phaser';
import { DEPTH } from '../config';
import { artScale, BOLT_TEXTURE, DART_TEXTURE, TRACER_TEXTURE } from '../art/textures';
import type { Enemy } from './Enemy';
import type { HitPayload } from '../systems/EnemySystem';

/** A pooled bolt flying to one enemy. fire() resets every field; despawn() returns it to the pool. */
export class Projectile extends Phaser.GameObjects.Image {
  target: Enemy | undefined;
  private targetSerial = 0;
  /** What it does when it lands (damage, splash, slow). */
  payload: HitPayload | undefined;
  /** Board units per second. */
  speed = 0;
  /** Seconds in flight; a projectile that never lands is stuck (the run check reads it). */
  age = 0;
  /** The fixed point the shot flies to (a predictive shot: it does not home). Both set or both undefined. */
  aimX: number | undefined;
  aimY: number | undefined;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, BOLT_TEXTURE);
    this.setDepth(DEPTH.projectiles);
    artScale(this);
    this.setActive(false).setVisible(false);
  }

  fire(x: number, y: number, target: Enemy, payload: HitPayload, speed: number, aimX?: number, aimY?: number): void {
    this.target = target;
    this.targetSerial = target.serial;
    this.payload = payload;
    this.speed = speed;
    this.age = 0;
    this.aimX = aimX;
    this.aimY = aimY;
    this.setRotation(0);
    const aimed = aimX !== undefined;
    const tracer = payload.pierce > 0 && !aimed;
    this.setTexture(aimed ? DART_TEXTURE : tracer ? TRACER_TEXTURE : BOLT_TEXTURE);
    this.setTint(payload.color);
    artScale(this, !tracer && !aimed && payload.splash > 0 ? 1.4 : 1);
    this.setPosition(x, y);
    this.setActive(true).setVisible(true);
  }

  /** The target is gone (killed, leaked, or recycled into a new enemy). */
  get lost(): boolean {
    return !this.target || !this.target.active || this.target.serial !== this.targetSerial;
  }

  /** Flies for `dt` seconds. Returns true when it reached where it flies to this frame. */
  advance(dt: number): boolean {
    const t = this.target;
    if (!t || this.lost) return false;
    this.age += dt;
    // An aimed shot flies to its fixed impact point and does not home; the rest chase the enemy.
    const ax = this.aimX ?? t.x;
    const ay = this.aimY ?? t.y;
    const dx = ax - this.x;
    const dy = ay - this.y;
    // A tracer or dart points where it flies (its texture is flat, so rotating it is allowed).
    if (this.aimX !== undefined || (this.payload?.pierce ?? 0) > 0) this.setRotation(Math.atan2(dx, -dy));
    const dist = Math.hypot(dx, dy);
    const step = this.speed * dt;
    if (dist <= step || dist < 6) {
      this.setPosition(ax, ay);
      return true;
    }
    this.setPosition(this.x + (dx / dist) * step, this.y + (dy / dist) * step);
    return false;
  }

  despawn(): void {
    this.target = undefined;
    this.payload = undefined;
    this.aimX = undefined;
    this.aimY = undefined;
    this.setActive(false).setVisible(false);
  }
}
