import Phaser from 'phaser';
import { TEX } from '../art/textures';
import { DEPTH } from '../config';

/** Pooled enemy projectile. SpawnSystem fires and ages them; CombatSystem resolves hits on the player. */
export class EnemyBullet extends Phaser.Physics.Arcade.Image {
  damage = 0;
  lifeLeft = 0;
  /** Speed at fire time; StillLifeSystem re-derives the live velocity from it each frame. */
  baseVx = 0;
  baseVy = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.enemyShot);
  }

  fire(x: number, y: number, angle: number, speed: number, damage: number, lifetimeSec: number): void {
    this.enableBody(true, x, y, true, true);
    (this.body as Phaser.Physics.Arcade.Body).setCircle(6, this.width / 2 - 6, this.height / 2 - 6);
    this.setDepth(DEPTH.projectiles);
    this.baseVx = Math.cos(angle) * speed;
    this.baseVy = Math.sin(angle) * speed;
    this.setVelocity(this.baseVx, this.baseVy);
    this.damage = damage;
    this.lifeLeft = lifetimeSec;
  }

  despawn(): void {
    this.disableBody(true, true);
  }
}
