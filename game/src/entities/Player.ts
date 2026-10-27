import Phaser from 'phaser';
import { TEX } from '../art/textures';
import { DEPTH, PLAYER_INVULN_MS, PLAYER_RADIUS } from '../config';
import { PALETTE } from '../content/palette';
import type { Vec2 } from '../core/vec';

const PULSE_PEAK = 1.25; // pop scale
const PULSE_MS = 300;
const PULSE_UP_MS = 100; // pop up in 100 ms, settle in the remaining 200
function easeOutQuad(u: number): number { return u * (2 - u); }

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
  /** Visual-only level-up pop: a body-less copy of the player texture. The sprite never scales, so the hitbox never changes. */
  private readonly pop: Phaser.GameObjects.Image;
  /** scene.time.now at which the pulse settles. */
  private pulseUntil = 0;
  private pulseQueued = false;
  /** Per-run trophy from The Palette: one ring stripe per swatch dodged, slot 0 (red) innermost. */
  readonly stripes: { color: number; slot: number }[] = [];
  private readonly stripeRing: Phaser.GameObjects.Graphics;
  /** Build depth: min(3, floor(totalLevels / 4)) 2 u ink rings at 4, 8 and 12 u past the outline. */
  private readonly buildRings: Phaser.GameObjects.Graphics;
  /** Build rings currently drawn (0..3); the 'build-rings' invariant checks it against the run. */
  buildDepth = 0;

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
    this.stripeRing = scene.add.graphics().setDepth(DEPTH.playerBarrel).setVisible(false);
    this.buildRings = scene.add.graphics().setDepth(DEPTH.playerBarrel).setVisible(false);
    this.pop = scene.add.image(x, y, TEX.player).setDepth(DEPTH.player + 1).setVisible(false);
  }

  /** Paints a 2 u ring stripe around the player in `color` at `slot`; no-op if the slot is taken. */
  paintStripe(color: number, slot: number): void {
    if (this.stripes.some((s) => s.slot === slot)) return;
    this.stripes.push({ color, slot });
    this.stripeRing.clear();
    for (const s of this.stripes) {
      this.stripeRing.lineStyle(2, s.color, 1);
      this.stripeRing.strokeCircle(0, 0, PLAYER_RADIUS + 3 + s.slot * 2);
    }
    this.stripeRing.setVisible(true);
  }

  /** Redraws the build rings from the run's total upgrade levels; no-op when the count is unchanged. */
  setBuildDepth(totalLevels: number): void {
    const count = Math.min(3, Math.floor(totalLevels / 4));
    if (count === this.buildDepth) return;
    this.buildDepth = count;
    this.buildRings.clear();
    this.buildRings.lineStyle(2, PALETTE.ink, 1);
    for (let i = 1; i <= count; i++) this.buildRings.strokeCircle(0, 0, PLAYER_RADIUS + i * 4);
    this.buildRings.setVisible(count > 0);
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

  /** Queue the level-up pop. The game may be paused when this is called; the first tick starts the clock. */
  pulse(): void {
    this.pulseQueued = true;
  }

  /** Drives the visual-only level-up pop on the body-less copy, so the body and stats never change. */
  private tickPulse(): void {
    const now = this.scene.time.now;
    if (this.pulseQueued) {
      this.pulseQueued = false;
      this.pulseUntil = now + PULSE_MS;
    }
    if (!this.visible || now >= this.pulseUntil) {
      if (this.pop.visible) this.pop.setScale(1).setVisible(false);
      if (this.buildRings.scaleX !== 1) this.buildRings.setScale(1);
      return;
    }
    const t = Math.max(0, now - (this.pulseUntil - PULSE_MS));
    const rising = t < PULSE_UP_MS;
    const u = easeOutQuad(rising ? t / PULSE_UP_MS : (t - PULSE_MS) / (PULSE_MS - PULSE_UP_MS));
    const s = 1 + (PULSE_PEAK - 1) * (rising ? u : 1 - u);
    if (this.pop.texture.key !== this.texture.key) this.pop.setTexture(this.texture.key);
    this.pop.setScale(s).setVisible(true).setAlpha(this.alpha);
    if (this.buildRings.visible) this.buildRings.setScale(s);
  }

  /** Called by GameScene after physics has moved the player this frame. */
  syncBarrel(): void {
    this.barrel.setPosition(this.x, this.y).setRotation(this.aimAngle);
    if (this.pop.visible) this.pop.setPosition(this.x, this.y);
    this.stripeRing.setPosition(this.x, this.y).setAlpha(this.alpha);
    this.buildRings.setPosition(this.x, this.y).setAlpha(this.alpha);
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
    this.tickPulse();
  }

  destroy(fromScene?: boolean): void {
    this.barrel.destroy();
    this.pop.destroy();
    this.stripeRing.destroy();
    this.buildRings.destroy();
    super.destroy(fromScene);
  }
}
