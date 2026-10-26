import Phaser from 'phaser';
import { projectileTextureKey, TEX } from '../art/textures';
import { DEPTH } from '../config';
import type { WeaponDef } from '../content/types';

export interface ShotParams {
  weapon: WeaponDef;
  x: number;
  y: number;
  angle: number;
  speed: number;
  damage: number;
  pierce: number;
}

/** Pooled projectile. WeaponSystem fires and ages them; CombatSystem resolves hits. */
export class Projectile extends Phaser.Physics.Arcade.Image {
  damage = 0;
  knockback = 0;
  /** Remaining enemies it may pass through. Below 0 = gone. */
  pierceLeft = 0;
  lifeLeft = 0;
  /** Serials of enemies already hit, so piercing shots hit each enemy once. */
  readonly hitSerials = new Set<number>();

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.dot);
  }

  fire(p: ShotParams): void {
    const { look } = p.weapon;
    this.setTexture(projectileTextureKey(p.weapon.id));
    this.enableBody(true, p.x, p.y, true, true);
    const r = Math.max(5, Math.min(look.length, look.width * 2) / 2 + 1);
    (this.body as Phaser.Physics.Arcade.Body).setCircle(r, this.width / 2 - r, this.height / 2 - r);
    this.setRotation(p.angle).setDepth(DEPTH.projectiles);
    this.setVelocity(Math.cos(p.angle) * p.speed, Math.sin(p.angle) * p.speed);
    this.damage = p.damage;
    this.knockback = p.weapon.knockback;
    this.pierceLeft = p.pierce;
    this.lifeLeft = p.weapon.lifetimeSec;
    this.hitSerials.clear();
  }

  despawn(): void {
    this.disableBody(true, true);
  }
}
