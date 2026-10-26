import Phaser from 'phaser';
import { enemyTextureKey, TEX } from '../art/textures';
import { DEPTH } from '../config';
import { PALETTE } from '../content/palette';
import type { EnemyDef } from '../content/types';
import type { Rng } from '../core/rng';
import { distance, normalize, sub, type Vec2 } from '../core/vec';

let nextSerial = 1;

/** 'shoot' tuning: preferred distance band, fire period, telegraph window, strafe amplitude. */
const SHOOT_BAND_NEAR = 240;
const SHOOT_BAND_FAR = 300;
const SHOOT_PERIOD = 2.4;
const SHOOT_TELEGRAPH = 0.4;
const SHOOT_STRAFE = 0.75;

/**
 * Pooled enemy. One class serves every EnemyDef; behavior is chosen by
 * `def.behavior` in steer(). To add a behavior: extend EnemyBehavior in
 * content/types.ts and add a case below.
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  def!: EnemyDef;
  hp = 0;
  maxHp = 0;
  /** Unique per spawn (pooled objects are reused), used by pierce bookkeeping. */
  serial = 0;
  private knock: Vec2 = { x: 0, y: 0 };
  private phase = 0;
  private age = 0;
  private flashMs = 0;
  // 'charger' state machine
  private chargeState: 'chase' | 'windup' | 'dash' = 'chase';
  private stateTimer = 0;
  private dashDir: Vec2 = { x: 0, y: 0 };
  // 'shoot' state machine
  private shootTimer = 0;
  private shotPending = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.dot);
  }

  spawn(def: EnemyDef, x: number, y: number, hpScale: number, rng: Rng): void {
    this.def = def;
    this.serial = nextSerial++;
    this.setTexture(enemyTextureKey(def.id));
    this.enableBody(true, x, y, true, true);
    const r = def.look.radius;
    (this.body as Phaser.Physics.Arcade.Body).setCircle(r, this.width / 2 - r, this.height / 2 - r);
    this.hp = this.maxHp = Math.max(1, Math.round(def.hp * hpScale));
    this.knock = { x: 0, y: 0 };
    this.phase = rng.range(0, Math.PI * 2);
    this.age = 0;
    this.flashMs = 0;
    this.chargeState = 'chase';
    this.stateTimer = rng.range(1.5, 3.5);
    this.shootTimer = rng.range(0.8, SHOOT_PERIOD);
    this.shotPending = false;
    this.setRotation(0).setAlpha(1).setScale(1).clearTint().setDepth(DEPTH.enemies);
  }

  /** Sets velocity toward `target` according to the behavior. Called every frame by SpawnSystem. */
  steer(target: Vec2, dt: number): void {
    this.age += dt;
    const toTarget = normalize(sub(target, this));
    let vx = 0;
    let vy = 0;
    switch (this.def.behavior) {
      case 'chase': {
        vx = toTarget.x * this.def.speed;
        vy = toTarget.y * this.def.speed;
        break;
      }
      case 'weaver': {
        const sway = Math.sin(this.age * 4 + this.phase) * 0.9;
        vx = (toTarget.x - toTarget.y * sway) * this.def.speed;
        vy = (toTarget.y + toTarget.x * sway) * this.def.speed;
        break;
      }
      case 'charger': {
        this.stateTimer -= dt;
        if (this.chargeState === 'chase') {
          vx = toTarget.x * this.def.speed;
          vy = toTarget.y * this.def.speed;
          if (this.stateTimer <= 0) {
            this.chargeState = 'windup';
            this.stateTimer = 0.6;
          }
        } else if (this.chargeState === 'windup') {
          this.setScale(1 + Math.sin(this.age * 40) * 0.05);
          if (this.stateTimer <= 0) {
            this.chargeState = 'dash';
            this.stateTimer = 0.45;
            this.dashDir = toTarget;
            this.setScale(1);
          }
        } else {
          vx = this.dashDir.x * this.def.speed * 5;
          vy = this.dashDir.y * this.def.speed * 5;
          if (this.stateTimer <= 0) {
            this.chargeState = 'chase';
            this.stateTimer = 2.5 + (this.phase % 1.5);
          }
        }
        break;
      }
      case 'shoot': {
        const dist = distance(target, this);
        const radial = dist < SHOOT_BAND_NEAR ? -1 : dist > SHOOT_BAND_FAR ? 1 : 0; // back off / hold / approach
        const strafe = Math.sin(this.age * 1.1 + this.phase) * SHOOT_STRAFE;
        vx = (toTarget.x * radial + toTarget.y * strafe) * this.def.speed;
        vy = (toTarget.y * radial - toTarget.x * strafe) * this.def.speed;
        this.shootTimer -= dt;
        if (this.shootTimer <= SHOOT_TELEGRAPH) {
          this.setTintFill(PALETTE.paperLight); // telegraph: flash before the shot
          if (this.shootTimer <= 0) {
            this.shotPending = true;
            this.shootTimer = SHOOT_PERIOD;
            this.clearTint();
          }
        }
        break;
      }
    }
    const decay = Math.exp(-8 * dt);
    this.knock = { x: this.knock.x * decay, y: this.knock.y * decay };
    this.setVelocity(vx + this.knock.x, vy + this.knock.y);

    // Spinners spin; everything else turns to face where it is going (shapes point right at angle 0).
    if (this.def.look.spin !== undefined) this.rotation += this.def.look.spin * dt;
    else if (vx !== 0 || vy !== 0) this.rotation = Math.atan2(vy, vx);
    if (this.flashMs > 0) {
      this.flashMs -= dt * 1000;
      if (this.flashMs <= 0) this.clearTint();
    }
  }

  /** True exactly once, the frame after a 'shoot' enemy decided to fire. SpawnSystem consumes it. */
  consumeShot(): boolean {
    const pending = this.shotPending;
    this.shotPending = false;
    return pending;
  }

  /** Applies damage and knockback. Returns true if this hit killed it. */
  hit(damage: number, from: Vec2, knockback: number): boolean {
    this.hp -= damage;
    const dir = normalize(sub(this, from));
    const k = knockback * (1 - this.def.knockbackResist);
    this.knock = { x: this.knock.x + dir.x * k, y: this.knock.y + dir.y * k };
    this.setTintFill(PALETTE.ink); // a black silhouette flash reads best on paper
    this.flashMs = 60;
    return this.hp <= 0;
  }

  despawn(): void {
    this.disableBody(true, true);
  }
}
