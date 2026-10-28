import type Phaser from 'phaser';
import { HUD } from '../../config';
import { PALETTE } from '../../content/palette';
import type { GameScene } from '../../scenes/GameScene';
import { makeButton, type Button } from '../button';
import { fillRing } from '../ring';
import { textStyle } from '../text';
import { EDGE, isNarrow, NEXT_SIZE, type HudPart } from './hud';

/**
 * Bottom right: the round ink button. In the build phase it shows a play mark and starts the wave
 * early (Space too), its teal ring counting down; during a wave it shows how many enemies are left,
 * and its red ring empties with them.
 */
export class NextWaveButton implements HudPart {
  private readonly button: Button;
  private readonly ring: Phaser.GameObjects.Graphics;
  private readonly play: Phaser.GameObjects.Graphics;
  private readonly left: Phaser.GameObjects.Text;
  private readonly title: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  private narrow = false;
  /** The most enemies seen left this wave: the full ring. */
  private waveSize = 1;

  constructor(scene: Phaser.Scene, game: GameScene) {
    this.ring = scene.add.graphics();
    this.button = makeButton(scene, 0, 0, '', () => game.flow.startWaveNow(), { width: NEXT_SIZE, height: NEXT_SIZE, radius: NEXT_SIZE / 2, fill: PALETTE.ink, fadeWhenDisabled: false });
    this.play = scene.add.graphics();
    this.play.fillStyle(PALETTE.card, 1);
    this.play.fillTriangle(-8, -13, -8, 13, 14, 0);
    this.left = scene.add.text(0, 0, '', textStyle(24, PALETTE.card, { fontStyle: 'bold' })).setOrigin(0.5);
    this.button.content.add([this.play, this.left]);
    this.title = scene.add.text(0, 0, '', textStyle(16, PALETTE.ink, { fontStyle: 'bold', align: 'right' })).setOrigin(1, 1);
    this.hint = scene.add.text(0, 0, '', textStyle(13, PALETTE.muted, { align: 'right' })).setOrigin(1, 0);
  }

  layout(width: number, height: number): void {
    this.narrow = isNarrow(width);
    const bottom = height - HUD.bottom / 2;
    const x = width - EDGE - NEXT_SIZE / 2 - 4;
    this.button.container.setPosition(x, bottom);
    this.ring.setPosition(x, bottom);
    if (this.narrow) {
      this.title.setOrigin(0.5, 1).setPosition(x, bottom - NEXT_SIZE / 2 - 22);
      this.hint.setVisible(false);
    } else {
      this.title.setOrigin(1, 1).setPosition(x - NEXT_SIZE / 2 - 14, bottom + 2);
      this.hint.setOrigin(1, 0).setPosition(x - NEXT_SIZE / 2 - 14, bottom + 4).setVisible(true);
    }
  }

  update(game: GameScene): void {
    const run = game.run;
    const ring = this.ring;
    ring.clear();
    const r = NEXT_SIZE / 2 + 7;
    const tau = Math.PI * 2;
    fillRing(ring, 0, 0, r, 5, 0, tau, PALETTE.ink, 0.1);
    if (run.phase === 'build') {
      const secs = Math.max(0, Math.ceil(run.buildLeftSec));
      fillRing(ring, 0, 0, r, 5, 0, (Math.max(0, run.buildLeftSec) / (game.flow.buildTotalSec || 1)) * tau, PALETTE.teal);
      this.title.setText(this.narrow ? `Wave ${run.wave + 1} · ${secs}s` : `Wave ${run.wave + 1}`);
      this.hint.setText(`in ${secs}s · Space`);
      this.button.setEnabled(true);
      this.play.setVisible(true);
      this.left.setVisible(false);
      this.waveSize = 1;
      return;
    }
    const leftCount = game.flow.enemiesLeft;
    this.waveSize = Math.max(this.waveSize, leftCount, 1);
    fillRing(ring, 0, 0, r, 5, 0, (leftCount / this.waveSize) * tau, PALETTE.red);
    this.title.setText(run.phase === 'wave' ? `Wave ${run.wave}` : 'Cleared');
    this.hint.setText(run.phase === 'wave' ? 'enemies left' : '');
    this.button.setEnabled(false);
    this.play.setVisible(false);
    this.left.setVisible(true).setText(String(leftCount));
  }
}
