import type Phaser from 'phaser';
import { PALETTE } from '../content/palette';
import { textStyle } from './text';

export interface ButtonOptions {
  width?: number;
  height?: number;
  fontSize?: number;
  /** Color of the hard shadow / hover fill. */
  color?: number;
}

/**
 * A flat paper button with an ink border and a colored offset shadow. Works with
 * mouse and touch. Returns a Container; minimum 44px tall for touch.
 */
export function makeButton(scene: Phaser.Scene, x: number, y: number, label: string, onClick: () => void, opts: ButtonOptions = {}): Phaser.GameObjects.Container {
  const width = opts.width ?? 220;
  const height = Math.max(44, opts.height ?? 52);
  const color = opts.color ?? PALETTE.yellow;
  const bg = scene.add.graphics();
  const draw = (hover: boolean): void => {
    bg.clear();
    bg.fillStyle(color, 1);
    bg.fillRect(-width / 2 + 4, -height / 2 + 4, width, height);
    bg.fillStyle(hover ? color : PALETTE.paperLight, 1);
    bg.fillRect(-width / 2, -height / 2, width, height);
    bg.lineStyle(3, PALETTE.ink, 1);
    bg.strokeRect(-width / 2, -height / 2, width, height);
  };
  draw(false);
  const text = scene.add.text(0, 0, label, textStyle(opts.fontSize ?? 22, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
  const container = scene.add.container(x, y, [bg, text]);
  container.setSize(width, height);
  container.setInteractive({ useHandCursor: true });
  container.on('pointerover', () => draw(true));
  container.on('pointerout', () => draw(false));
  container.on('pointerup', () => onClick());
  return container;
}
