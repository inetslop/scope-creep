import Phaser from 'phaser';
import { PALETTE } from '../content/palette';
import { hook } from '../debug/testHook';
import { makeButton } from '../ui/button';
import { titleStyle } from '../ui/text';
import { onResize, SCENES } from './keys';

/** Pause overlay above a paused GameScene. */
export class PauseScene extends Phaser.Scene {
  constructor() {
    super(SCENES.pause);
  }

  create(): void {
    hook.overlay = SCENES.pause;
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, PALETTE.paper, 0.88).setOrigin(0).setInteractive();
    this.add.text(width / 2, height * 0.3, 'PAUSED', titleStyle(Math.min(60, width * 0.12), PALETTE.ink, PALETTE.blue)).setOrigin(0.5);
    makeButton(this, width / 2, height * 0.52, 'Resume', () => this.resumeGame());
    makeButton(this, width / 2, height * 0.52 + 70, 'Quit to menu', () => this.quitToMenu(), { color: PALETTE.red });
    this.input.keyboard?.once('keydown-ESC', () => this.resumeGame());
    this.input.keyboard?.once('keydown-P', () => this.resumeGame());
    onResize(this, () => this.scene.restart());
  }

  private resumeGame(): void {
    this.scene.resume(SCENES.game);
    this.scene.stop();
  }

  private quitToMenu(): void {
    this.scene.stop(SCENES.hud);
    this.scene.stop(SCENES.game);
    this.scene.start(SCENES.menu);
  }
}
