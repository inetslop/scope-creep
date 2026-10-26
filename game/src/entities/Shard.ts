import Phaser from 'phaser';
import { TEX } from '../art/textures';
import { DEPTH } from '../config';

/** XP pickup dropped by enemies. Not a physics object: PickupSystem moves it by hand. */
export class Shard extends Phaser.GameObjects.Image {
  value = 1;
  /** Once true it flies to the player even if the player moves away. */
  magnetized = false;
  vx = 0;
  vy = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.shard);
  }

  drop(x: number, y: number, value: number): void {
    this.setPosition(x, y).setActive(true).setVisible(true).setDepth(DEPTH.pickups);
    this.value = value;
    this.magnetized = false;
    this.vx = 0;
    this.vy = 0;
    this.setScale(1 + Math.min(value, 12) * 0.07);
    this.setRotation(0);
  }

  despawn(): void {
    this.setActive(false).setVisible(false);
  }
}
