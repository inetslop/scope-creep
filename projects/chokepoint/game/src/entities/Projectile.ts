import Phaser from 'phaser';
import { DEPTH } from '../config';
import { artScale, BOLT_TEXTURE } from '../art/textures';
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

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, BOLT_TEXTURE);
    this.setDepth(DEPTH.projectiles);
    artScale(this);
    this.setActive(false).setVisible(false);
  }

  fire(x: number, y: number, target: Enemy, payload: HitPayload, speed: number): void {
    this.target = target;
    this.targetSerial = target.serial;
    this.payload = payload;
    this.speed = speed;
    this.setTint(payload.color);
    artScale(this, payload.splash > 0 ? 1.4 : 1);
    this.setPosition(x, y);
    this.setActive(true).setVisible(true);
  }

  /** The target is gone (killed, leaked, or recycled into a new enemy). */
  get lost(): boolean {
    return !this.target || !this.target.active || this.target.serial !== this.targetSerial;
  }

  /** Flies for `dt` seconds. Returns true when it reached its target this frame. */
  advance(dt: number): boolean {
    const t = this.target;
    if (!t || this.lost) return false;
    const dx = t.x - this.x;
    const dy = t.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * dt;
    if (dist <= step || dist < 6) {
      this.setPosition(t.x, t.y);
      return true;
    }
    this.setPosition(this.x + (dx / dist) * step, this.y + (dy / dist) * step);
    return false;
  }

  despawn(): void {
    this.target = undefined;
    this.payload = undefined;
    this.setActive(false).setVisible(false);
  }
}
