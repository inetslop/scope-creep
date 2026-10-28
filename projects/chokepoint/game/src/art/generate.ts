import type Phaser from 'phaser';
import { paintEntityTextures } from './entities';
import { paintIconTextures } from './icons';
import { paintMenuRoad } from './menu';

/**
 * Everything painted once at boot, one painter per line. A new kind of texture gets its own
 * painter module in art/ and one line here. (Barrels and boards are painted when needed.)
 */
const PAINTERS: readonly ((scene: Phaser.Scene) => unknown)[] = [
  paintEntityTextures,
  paintIconTextures,
  paintMenuRoad,
];

export function generateTextures(scene: Phaser.Scene): void {
  for (const paint of PAINTERS) paint(scene);
}
