import type Phaser from 'phaser';
import { HUD } from '../../config';
import { PALETTE } from '../../content/palette';
import type { GameScene } from '../../scenes/GameScene';
import { makeCard } from '../card';
import { textStyle } from '../text';
import { EDGE, type HudPart } from './hud';

/** Top right, left of the pause button: the wave number ("Ready" before the first). */
export class WaveCard implements HudPart {
  private readonly box: Phaser.GameObjects.Container;
  private readonly wave: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.wave = scene.add.text(0, 1, '', textStyle(18, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
    this.box = scene.add.container(0, 0, [makeCard(scene, 0, 0, 120, 48, 24), this.wave]);
  }

  layout(width: number): void {
    this.box.setPosition(width - EDGE - 48 - 10 - 60, HUD.top / 2);
  }

  update(game: GameScene): void {
    this.wave.setText(game.run.wave > 0 ? `Wave ${game.run.wave}` : 'Ready');
  }
}
