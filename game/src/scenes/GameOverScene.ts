import Phaser from 'phaser';
import { TEX } from '../art/textures';
import { PALETTE } from '../content/palette';
import { formatTime } from '../core/progression';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { makeButton } from '../ui/button';
import { textStyle, titleStyle } from '../ui/text';
import type { RunSummary } from './GameScene';
import { onResize, SCENES } from './keys';

export class GameOverScene extends Phaser.Scene {
  private armed = false;

  constructor() {
    super(SCENES.gameOver);
  }

  create(summary: RunSummary): void {
    hook.scene = SCENES.gameOver;
    hook.overlay = '';
    this.armed = false;
    const { width, height } = this.scale;
    const short = Math.min(width, height);

    this.add.tileSprite(0, 0, width, height, TEX.floor).setOrigin(0);
    this.add.text(width / 2, height * 0.2, 'ERASED', titleStyle(Math.min(72, short * 0.14), PALETTE.red, PALETTE.ink)).setOrigin(0.5);
    const lines = [`Survived  ${formatTime(summary.timeSec)}`, `Level  ${summary.level}`, `${summary.kills} shapes erased`, `Best streak  ×${summary.bestStreak}`, `SCORE ${summary.score}`, `BEST ${summary.best}`];
    this.add.text(width / 2, height * 0.42, lines.join('\n'), textStyle(Math.min(26, short * 0.055), PALETTE.ink, { align: 'center', lineSpacing: 10 })).setOrigin(0.5);

    const restart = (): void => {
      if (this.armed) this.scene.start(SCENES.game);
    };
    makeButton(this, width / 2, height * 0.66, 'Try again', restart);
    makeButton(this, width / 2, height * 0.66 + 68, 'Menu', () => this.armed && this.scene.start(SCENES.menu), { color: PALETTE.blue });
    this.input.keyboard?.on('keydown-ENTER', restart);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.keyboard?.off('keydown-ENTER', restart));

    this.time.delayedCall(600, () => (this.armed = true));
    if (flags.smoke) this.time.delayedCall(800, () => this.scene.start(SCENES.game));
    onResize(this, () => this.scene.restart(summary));
  }
}
