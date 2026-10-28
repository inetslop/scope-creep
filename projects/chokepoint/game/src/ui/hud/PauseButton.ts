import type Phaser from 'phaser';
import { HUD } from '../../config';
import { PALETTE } from '../../content/palette';
import type { GameScene } from '../../scenes/GameScene';
import { makeButton, type Button } from '../button';
import { EDGE, type HudPart } from './hud';

/** Top right corner: pause. */
export class PauseButton implements HudPart {
  private readonly button: Button;

  constructor(scene: Phaser.Scene, game: GameScene) {
    this.button = makeButton(scene, 0, 0, '', () => game.openPause(), { width: 48, height: 48, radius: 24 });
    const bars = scene.add.graphics();
    bars.fillStyle(PALETTE.ink, 1);
    bars.fillRoundedRect(-7, -9, 5, 18, 2);
    bars.fillRoundedRect(2, -9, 5, 18, 2);
    this.button.content.add(bars);
  }

  layout(width: number): void {
    this.button.container.setPosition(width - EDGE - 24, HUD.top / 2);
  }

  update(): void {}
}
