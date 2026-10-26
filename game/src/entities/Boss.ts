import Phaser from 'phaser';
import { TEX } from '../art/textures';
import { DEPTH } from '../config';
import { FRAME } from '../content/bosses/frame';
import { takeSerial } from './serial';

/**
 * The boss: a giant picture frame with a red core. A unique entity, not pooled
 * and not an EnemyDef: one instance per run, driven by BossSystem. The core is
 * a separate image pinned to the frame's center (Phaser sprites have no
 * children), synced from GameScene's POST_UPDATE like the player's barrel.
 */
export class Boss extends Phaser.Physics.Arcade.Sprite {
  /** The red core, drawn at the frame's center. */
  readonly core: Phaser.GameObjects.Image;
  hp = 0;
  maxHp = 0;
  /** Unique per spawn, used by pierce bookkeeping. */
  serial = 0;
  /** Hit-flash countdown in ms; BossSystem decrements it and reads it for the core tint. */
  flashMs = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, TEX.bossFrame);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    // A dormant body at (0,0) so it is never stepped while the boss is off.
    this.disableBody(true, true);
    this.core = scene.add.image(0, 0, TEX.bossCore).setVisible(false);
    this.setDepth(DEPTH.enemies);
    this.core.setDepth(DEPTH.enemies + 1);
  }

  spawn(x: number, y: number, hp: number): void {
    this.enableBody(true, x, y, true, true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(FRAME.frameSize / 2, this.width / 2 - FRAME.frameSize / 2, this.height / 2 - FRAME.frameSize / 2);
    // The slide-in starts above the arena; world bounds would clamp it back.
    body.setCollideWorldBounds(false);
    this.setVelocity(0, 0);
    this.serial = takeSerial();
    this.hp = this.maxHp = hp;
    this.flashMs = 0;
    this.setRotation(0).setAlpha(1).setScale(1).clearTint();
    this.core.setPosition(x, y).setVisible(true).clearTint();
  }

  /** Applies damage, no knockback. Returns true if this hit killed it. */
  hit(damage: number): boolean {
    this.hp -= damage;
    this.flashMs = 60;
    return this.hp <= 0;
  }

  /** Keeps the core pinned to the frame's center; called from GameScene's POST_UPDATE. */
  syncCore(): void {
    this.core.setPosition(this.x, this.y);
  }

  despawn(): void {
    this.disableBody(true, true);
    this.core.setVisible(false);
  }

  destroy(fromScene?: boolean): void {
    this.core.destroy();
    super.destroy(fromScene);
  }
}
