import Phaser from 'phaser';
import { DEPTH } from '../config';
import { artScale, BOLT_TEXTURE, TRACER_TEXTURE } from '../art/textures';
import { lightOf } from '../content/palette';
import type { Enemy } from './Enemy';
import type { HitPayload } from '../systems/EnemySystem';

/** A pooled projectile: a bolt homing to one enemy, or a straight pellet of a Spray's blast. fire() and firePellet() reset every field; despawn() returns it to the pool. */
export class Projectile extends Phaser.GameObjects.Image {
  target: Enemy | undefined;
  private targetSerial = 0;
  /** What it does when it lands (damage, splash, slow). */
  payload: HitPayload | undefined;
  /** Board units per second. */
  speed = 0;
  /** Seconds in flight; a projectile that never lands is stuck (the run check reads it). */
  age = 0;
  /** The way it flies (unit vector), refreshed on fire() and every advance: the plate reads it. */
  fx = 1;
  fy = 0;
  /** Thin tracer that points where it flies (a piercing shot, a Spray's pellet). */
  private tracer = false;
  /** A pellet of a blast: it flies straight along its direction (ProjectileSystem flies it and checks hits). */
  straight = false;
  private dirX = 0;
  private dirY = 0;
  /** Board units the pellet has flown; it vanishes at maxDist. */
  private traveled = 0;
  private maxDist = 0;
  /** The blast number this pellet came from (0: a homing bolt). */
  blast = 0;
  /** Enemies a piercing pellet has already struck (it keeps going along its own line). */
  readonly skip: Enemy[] = [];

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, BOLT_TEXTURE);
    this.setDepth(DEPTH.projectiles);
    artScale(this);
    this.setActive(false).setVisible(false);
  }

  fire(x: number, y: number, target: Enemy, payload: HitPayload, speed: number, asTracer = false): void {
    this.target = target;
    this.targetSerial = target.serial;
    this.payload = payload;
    this.speed = speed;
    this.age = 0;
    this.straight = false;
    this.traveled = 0;
    this.blast = 0;
    this.skip.length = 0;
    this.tracer = asTracer || payload.pierce > 0;
    this.setRotation(0);
    this.setTexture(this.tracer ? TRACER_TEXTURE : BOLT_TEXTURE);
    this.setTint(payload.color);
    artScale(this, !this.tracer && payload.splash > 0 ? 1.4 : 1);
    this.setPosition(x, y);
    // A pierce leg and a needle re-fire from their spot: each gets its own flight toward its target.
    const d = Math.hypot(target.x - x, target.y - y);
    if (d > 0) {
      this.fx = (target.x - x) / d;
      this.fy = (target.y - y) / d;
    }
    this.setActive(true).setVisible(true);
  }

  /** A pellet of a Spray's blast: straight along (dirX, dirY), vanishing at `maxDist` board units out. */
  firePellet(x: number, y: number, dirX: number, dirY: number, payload: HitPayload, speed: number, maxDist: number, blast: number): void {
    this.target = undefined;
    this.payload = payload;
    this.speed = speed;
    this.age = 0;
    this.straight = true;
    this.dirX = dirX;
    this.dirY = dirY;
    this.fx = dirX;
    this.fy = dirY;
    this.traveled = 0;
    this.maxDist = maxDist;
    this.blast = blast;
    this.skip.length = 0;
    this.tracer = true;
    this.setTexture(TRACER_TEXTURE);
    this.setTint(lightOf(payload.color));
    artScale(this, 1);
    this.setRotation(Math.atan2(dirX, -dirY));
    this.setPosition(x, y);
    this.setActive(true).setVisible(true);
  }

  /** The target is gone (killed, leaked, or recycled into a new enemy). */
  get lost(): boolean {
    return !this.target || !this.target.active || this.target.serial !== this.targetSerial;
  }

  /** Flies for `dt` seconds. Returns true when it landed (or a pellet ran out of road) this frame. */
  advance(dt: number): boolean {
    if (this.straight) {
      this.age += dt;
      const step = this.speed * dt;
      this.traveled += step;
      this.setPosition(this.x + this.dirX * step, this.y + this.dirY * step);
      return this.traveled >= this.maxDist;
    }
    const t = this.target;
    if (!t || this.lost) return false;
    this.age += dt;
    const dx = t.x - this.x;
    const dy = t.y - this.y;
    // A tracer points where it flies (its texture is flat, so rotating it is allowed).
    if (this.tracer) this.setRotation(Math.atan2(dx, -dy));
    const dist = Math.hypot(dx, dy);
    if (dist > 0) {
      this.fx = dx / dist;
      this.fy = dy / dist;
    }
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
    this.straight = false;
    this.skip.length = 0;
    this.setActive(false).setVisible(false);
  }
}
