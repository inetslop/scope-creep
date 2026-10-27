import Phaser from 'phaser';
import { paletteSwatchTextureKey, TEX } from '../art/textures';
import { DEPTH } from '../config';
import type { FrameBossDef, GridBossDef, PaletteBossDef, PressBossDef } from '../content/bosses';
import { takeSerial } from './serial';

/**
 * The boss: a big body (frame, compass or swatch tile) with a core at its
 * center. A unique entity, not pooled and not an EnemyDef: one instance per
 * run, driven by BossSystem. The core is a separate image pinned to the
 * body's center (Phaser sprites have no children), synced from GameScene's
 * POST_UPDATE like the player's barrel. The palette's swatch body has no core.
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

  spawn(x: number, y: number, hp: number, def: FrameBossDef | GridBossDef | PaletteBossDef | PressBossDef): void {
    if (def.behavior === 'palette') {
      // A falling swatch tile (rect body); the docked rail is BossSystem graphics, not the body.
      this.setTexture(paletteSwatchTextureKey(0));
      this.enableBody(true, x, y, true, true);
      const body = this.body as Phaser.Physics.Arcade.Body;
      // setSize also clears any setCircle from a previous grid spawn on this persistent body.
      body.setSize(def.swatchWidth, def.swatchHeight);
      body.setOffset((this.width - def.swatchWidth) / 2, (this.height - def.swatchHeight) / 2);
      body.setCollideWorldBounds(false);
      this.setVelocity(0, 0);
      this.serial = takeSerial();
      this.hp = this.maxHp = hp;
      this.flashMs = 0;
      this.setRotation(0).setAlpha(1).setScale(1).clearTint();
      this.core.setVisible(false);
      return;
    }
    if (def.behavior === 'press') {
      // The wall: the dot texture is invisible and only carries the hit region
      // (BossSystem sizes it to the full safe-width band); the visible band is
      // BossSystem graphics, and pushing is a manual clamp, so no world bounds.
      this.setTexture(TEX.dot);
      // enableBody's show flag would re-show the sprite, so pass false and keep the dot hidden.
      this.enableBody(true, x, y, true, false);
      this.setVisible(false);
      (this.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(false);
      this.setVelocity(0, 0);
      this.serial = takeSerial();
      this.hp = this.maxHp = hp;
      this.flashMs = 0;
      this.setRotation(0).setAlpha(1).setScale(1).clearTint();
      this.core.setVisible(false);
      return;
    }
    this.setTexture(def.behavior === 'grid' ? TEX.bossGrid : TEX.bossFrame);
    this.core.setTexture(def.behavior === 'grid' ? TEX.bossGridCore : TEX.bossCore);
    this.enableBody(true, x, y, true, true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(def.bodyRadius, this.width / 2 - def.bodyRadius, this.height / 2 - def.bodyRadius);
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
