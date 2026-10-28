import type Phaser from 'phaser';
import { HUD, ZOOM } from '../../config';
import { PALETTE } from '../../content/palette';
import type { GameScene } from '../../scenes/GameScene';
import { makeButton, type Button } from '../button';
import { EDGE, type HudPart } from './hud';

/** Right edge, under the pause button: zoom in and out (pinch, the wheel and + - do the same). */
export class ZoomButtons implements HudPart {
  private readonly zoomIn: Button;
  private readonly zoomOut: Button;

  constructor(scene: Phaser.Scene, game: GameScene) {
    const glyph = (button: Button, plus: boolean): void => {
      const g = scene.add.graphics();
      g.fillStyle(PALETTE.ink, 1);
      g.fillRoundedRect(-9, -2, 18, 4, 2);
      if (plus) g.fillRoundedRect(-2, -9, 4, 18, 2);
      button.content.add(g);
    };
    this.zoomIn = makeButton(scene, 0, 0, '', () => game.board.zoomIn(), { width: 48, height: 48, radius: 24 });
    this.zoomOut = makeButton(scene, 0, 0, '', () => game.board.zoomOut(), { width: 48, height: 48, radius: 24 });
    glyph(this.zoomIn, true);
    glyph(this.zoomOut, false);
  }

  layout(width: number): void {
    this.zoomIn.container.setPosition(width - EDGE - 24, HUD.top + 34);
    this.zoomOut.container.setPosition(width - EDGE - 24, HUD.top + 34 + 58);
  }

  update(game: GameScene): void {
    this.zoomIn.setEnabled(game.board.zoom < ZOOM.max - 1e-3);
    this.zoomOut.setEnabled(game.board.zoom > ZOOM.min + 1e-3);
  }
}
