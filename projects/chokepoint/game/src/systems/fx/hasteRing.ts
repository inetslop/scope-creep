import { TOWER_BODY } from '../../art/textures';
import { CELL, DEPTH } from '../../config';
import { fillRing } from '../../ui/ring';
import type Phaser from 'phaser';

/**
 * One beat of a Haste tower's working ring (T0354): the Mute ring's own fade in and out, from
 * the tower's body out to the radius over 1 s of scene.time. A draw, not a tracked effect: the
 * caller owns both returned handles and drops them (HasteSystem.dropRing).
 */
export function hasteRing(
  scene: Phaser.Scene,
  x: number,
  y: number,
  radius: number,
  color: number,
): { g: Phaser.GameObjects.Graphics; tw: Phaser.Tweens.Tween } {
  const g = scene.add.graphics().setDepth(DEPTH.preview).setPosition(x, y);
  fillRing(g, 0, 0, radius, 3, 0, Math.PI * 2, color, 0.9);
  g.setScale((TOWER_BODY * CELL) / radius);
  const tw = scene.tweens.add({
    targets: g,
    scale: 1,
    alpha: 0,
    duration: 1000,
    ease: 'Quad.easeOut',
    onComplete: () => g.destroy(),
  });
  return { g, tw };
}
