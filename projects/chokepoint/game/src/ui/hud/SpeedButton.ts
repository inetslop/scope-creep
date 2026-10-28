import type Phaser from 'phaser';
import { HUD } from '../../config';
import { PALETTE } from '../../content/palette';
import type { GameScene } from '../../scenes/GameScene';
import { makeButton, type Button } from '../button';
import { cardTexture } from '../card';
import { textStyle } from '../text';
import { EDGE, NEXT_SIZE, isNarrow, type HudPart } from './hud';

/**
 * Bottom right, left of the next-wave button: 2x fast-forward for the wave phase. White at 1x,
 * filled yellow while it runs; only tappable during a wave (F too). Outside the wave phase the
 * speed resets to 1x and the card un-fills.
 */
export class SpeedButton implements HudPart {
  private readonly button: Button;
  private readonly card: Phaser.GameObjects.Image;
  private readonly hint: Phaser.GameObjects.Text;
  private readonly white: string;
  private readonly yellow: string;
  private narrow = false;
  private fast = false;

  constructor(scene: Phaser.Scene, game: GameScene) {
    this.button = makeButton(scene, 0, 0, '2x', () => game.speed.toggle(game.run.phase === 'wave'), { width: 48, height: 48, radius: 24, fontSize: 15 });
    this.card = this.button.container.list[0] as Phaser.GameObjects.Image;
    this.white = cardTexture(scene, 48, 48, 24);
    this.yellow = cardTexture(scene, 48, 48, 24, PALETTE.yellow);
    this.hint = scene.add.text(0, 0, 'F', textStyle(11, PALETTE.faint, { fontStyle: 'bold' })).setOrigin(0.5, 0);
  }

  layout(width: number, height: number): void {
    this.narrow = isNarrow(width);
    // Left of the next-wave button; on wide screens its words sit in that gap (see NextWaveButton), so clear them.
    const x = width - EDGE - NEXT_SIZE / 2 - 4 - NEXT_SIZE / 2 - 10 - 24 - (this.narrow ? 0 : 14 + 120);
    this.button.container.setPosition(x, height - HUD.bottom / 2);
    this.hint.setPosition(x, height - HUD.bottom / 2 + 30); // just under the button, inside the bottom bar
  }

  update(game: GameScene): void {
    const inWave = game.run.phase === 'wave';
    this.button.setEnabled(inWave);
    this.hint.setVisible(inWave && !this.narrow);
    const fast = inWave && game.speed.speed === 2;
    if (fast !== this.fast) {
      this.fast = fast;
      this.card.setTexture(fast ? this.yellow : this.white);
    }
  }
}
