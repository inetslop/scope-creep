import Phaser from 'phaser';
import { TEX } from '../art/textures';
import { DEPTH, PLAYER_INVULN_MS, PLAYER_RADIUS } from '../config';
import type { Vec2 } from '../core/vec';

/** The player: a blue circle with an ink barrel. Movement/aim come from GameScene; stats from RunState. */
export class Player extends Phaser.Physics.Arcade.Sprite {
  /** Radians. Where the barrel points. */
  aimAngle = 0;
  /** scene.time.now until which contact damage is ignored. */
  invulnerableUntil = 0;
  /** scene.time.now until which the player is drawn red after a hit. */
  private hurtUntil = 0;
  /** One-shot shove velocity (e.g. a Platen slam). Decays like Enemy knockback; drive() folds it into the set velocity. */
  private knock: Vec2 = { x: 0, y: 0 };
  private readonly barrel: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.player);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(PLAYER_RADIUS, this.width / 2 - PLAYER_RADIUS, this.height / 2 - PLAYER_RADIUS);
    body.setCollideWorldBounds(true);
    this.setDepth(DEPTH.player);
    // Drawn under the body so it reads as sticking out of the circle.
    this.barrel = scene.add.image(x, y, TEX.barrel).setOrigin(0.05, 0.5).setDepth(DEPTH.playerBarrel);
  }

  /** `dir` has length 0..1. */
  drive(dir: Vec2, speed: number): void {
    this.setVelocity(dir.x * speed + this.knock.x, dir.y * speed + this.knock.y);
  }

  /** Adds a one-shot shove in `dir` (unit vector). Decays exponentially, like an enemy's knock. */
  knockback(dir: Vec2, strength: number): void {
    this.knock = { x: this.knock.x + dir.x * strength, y: this.knock.y + dir.y * strength };
  }

  /** World position of the barrel tip, where projectiles spawn. */
  muzzle(): Vec2 {
    return { x: this.x + Math.cos(this.aimAngle) * 30, y: this.y + Math.sin(this.aimAngle) * 30 };
  }

  /** Took a hit: briefly red, then the invulnerability flicker. */
  hurt(now: number): void {
    this.invulnerableUntil = now + PLAYER_INVULN_MS;
    this.hurtUntil = now + 110;
  }

  isInvulnerable(now: number): boolean {
    return now < this.invulnerableUntil;
  }

  /** Called by GameScene after physics has moved the player this frame. */
  syncBarrel(): void {
    this.barrel.setPosition(this.x, this.y).setRotation(this.aimAngle);
  }

  protected preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    const knockDecay = Math.exp(-8 * (delta / 1000));
    this.knock = { x: this.knock.x * knockDecay, y: this.knock.y * knockDecay };
    const hurt = time < this.hurtUntil;
    const texture = hurt ? TEX.playerHurt : TEX.player;
    if (this.texture.key !== texture) this.setTexture(texture);
    const flicker = !hurt && this.isInvulnerable(time) && Math.floor(time / 70) % 2 === 0;
    this.setAlpha(flicker ? 0.35 : 1);
    this.barrel.setAlpha(this.alpha).setVisible(this.visible);
  }

  destroy(fromScene?: boolean): void {
    this.barrel.destroy();
    super.destroy(fromScene);
  }
}
