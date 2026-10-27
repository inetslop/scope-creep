import Phaser from 'phaser';
import { drawShape } from '../art/shapes';
import { TEX } from '../art/textures';
import { PALETTE } from '../content/palette';
import type { ShapeKind } from '../content/types';
import { hook } from '../debug/testHook';
import { textStyle, titleStyle } from '../ui/text';
import { onResize, SCENES } from './keys';

export class MenuScene extends Phaser.Scene {
  private shapes: Phaser.GameObjects.Graphics[] = [];

  constructor() {
    super(SCENES.menu);
  }

  create(): void {
    hook.scene = SCENES.menu;
    hook.overlay = '';
    const { width, height } = this.scale;
    const short = Math.min(width, height);
    const titleSize = Math.min(76, short * 0.12);

    this.add.tileSprite(0, 0, width, height, TEX.floor).setOrigin(0);
    // A Kandinsky-ish composition of the game's own shapes, drawn at full size (not scaled textures).
    // Portrait phones: keep the corner shapes clear of the title and the big circle below the hint.
    const portrait = height > width;
    const backdrop = this.add.graphics();
    backdrop.fillStyle(PALETTE.red, 1);
    backdrop.fillCircle(width * (portrait ? 0.15 : 0.2), height * (portrait ? 0.9 : 0.78), short * (portrait ? 0.2 : 0.22));
    backdrop.lineStyle(6, PALETTE.ink, 1);
    backdrop.lineBetween(width * 0.02, height * 0.94, width * 0.98, height * 0.86);
    this.shapes = [
      this.decoration(width * 0.86, height * (portrait ? 0.32 : 0.22), 'square', short * (portrait ? 0.11 : 0.15), PALETTE.yellow, PALETTE.ink),
      this.decoration(width * 0.12, height * (portrait ? 0.33 : 0.2), 'diamond', short * 0.07, PALETTE.ink, PALETTE.yellow),
      this.decoration(width * (portrait ? 0.82 : 0.78), height * 0.8, 'triangle', short * 0.1, PALETTE.red, PALETTE.paperLight),
      this.decoration(width * 0.5, height * 0.44, 'circle', short * 0.1, PALETTE.blue, PALETTE.yellow),
    ];

    this.add.text(width / 2, height * 0.16, 'SCOPE CREEP', titleStyle(titleSize)).setOrigin(0.5);
    this.add.text(width / 2, height * 0.16 + titleSize * 0.85, 'an abstract twin-stick roguelite', textStyle(Math.min(22, short * 0.045), PALETTE.inkSoft)).setOrigin(0.5);

    const touch = this.sys.game.device.input.touch;
    const prompt = this.add
      .text(width / 2, height * 0.66, touch ? 'Tap to start' : 'Click or press Enter to start', textStyle(Math.min(30, short * 0.06), PALETTE.ink, { fontStyle: 'bold' }))
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
    const hint = touch ? 'Left thumb: move  ·  Right thumb: aim & fire' : 'WASD: move  ·  Mouse: aim  ·  Hold click: fire  ·  Space: decoy  ·  Esc: pause';
    this.add.text(width / 2, height * 0.74, hint, textStyle(Math.min(18, short * 0.036), PALETTE.inkSoft)).setOrigin(0.5);
    this.add.text(width - 8, height - 6, `build ${hook.sha}`, textStyle(12, PALETTE.gray)).setOrigin(1, 1);

    const start = (): void => {
      this.scene.start(SCENES.game);
    };
    this.input.once('pointerup', start);
    this.input.keyboard?.once('keydown-ENTER', start);
    this.input.keyboard?.once('keydown-SPACE', start);
    this.input.gamepad?.once('down', start);

    onResize(this, () => this.scene.restart());
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    this.shapes.forEach((s, i) => (s.rotation += dt * [0.15, -0.4, 0.25, 0][i]!));
  }

  private decoration(x: number, y: number, kind: ShapeKind, r: number, color: number, accent: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics({ x, y });
    drawShape(g, kind, 0, 0, r, color, { outlineWidth: Math.max(4, r * 0.1) });
    drawShape(g, 'circle', 0, 0, r * 0.25, accent, { outlineWidth: accent === PALETTE.ink ? 0 : 3, shadow: false });
    return g;
  }
}
