import Phaser from 'phaser';
import { TEX } from '../art/textures';
import { DEPTH } from '../config';
import { takeSerial } from './serial';

/**
 * One of The Press's type blocks: a flat grey square printed on the wall's
 * leading edge. A boss part (pooled in BossSystem's blocks group), not an
 * enemy: no XP, no score, no kill count, no marginalia, and it never counts
 * against the regular enemy pool. Destroy all four of a row to pull the wall
 * back. See src/systems/BossSystem.ts for the encounter.
 */
export class TypeBlock extends Phaser.Physics.Arcade.Image {
  hp = 0;
  maxHp = 0;
  /** Unique per spawn (pooled objects are reused), used by pierce bookkeeping. */
  serial = 0;
  /** Contact damage on the player. */
  contactDamage = 0;
  /** Position in the row: 0..3 (the 20%, 40%, 60% and 80% safe-width marks). */
  slot = 0;
  /** Hit-flash countdown in ms; BossSystem decrements it and reads it for the tint. */
  flashMs = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.typeBlock);
  }

  spawn(x: number, y: number, hp: number, size: number, contactDamage: number): void {
    this.serial = takeSerial();
    this.enableBody(true, x, y, true, true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    // Pooled bodies keep physics config, so reset the rect for every print.
    body.setSize(size, size);
    body.setOffset((this.width - size) / 2, (this.height - size) / 2);
    this.hp = this.maxHp = hp;
    this.contactDamage = contactDamage;
    this.slot = 0;
    this.flashMs = 0;
    this.setDepth(DEPTH.enemies);
    this.setAlpha(1).setRotation(0).setScale(1).clearTint();
  }

  /** Applies damage, no knockback. Returns true if this hit destroyed the block. */
  hit(damage: number): boolean {
    this.hp -= damage;
    this.flashMs = 60;
    return this.hp <= 0;
  }

  despawn(): void {
    this.disableBody(true, true);
  }
}
