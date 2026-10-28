import Phaser from 'phaser';
import { cssColor, PALETTE } from '../content/palette';
import { recordRun } from '../core/profile';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { makeButton } from '../ui/button';
import { makeCard } from '../ui/card';
import { uiCamera, viewSize } from '../ui/display';
import { textStyle, titleStyle } from '../ui/text';
import { getRun, getSfx, onKey, onResize, SCENES } from './keys';

/** The run is over: how far it got, the best run, play again. In ?smoke mode it restarts on its own. */
export class GameOverScene extends Phaser.Scene {
  constructor() {
    super(SCENES.gameOver);
  }

  create(): void {
    uiCamera(this);
    hook.scene = SCENES.gameOver;
    hook.overlay = '';
    this.cameras.main.setBackgroundColor(cssColor(PALETTE.ground));
    const run = getRun(this);
    const result = recordRun(window.localStorage, { waves: run.wavesCleared, stopped: run.kills, clean: run.cleanWaves });
    const again = (): void => {
      this.scene.start(SCENES.game);
    };
    const claim = (): void => {
      this.scene.start(SCENES.rewards);
    };

    const panelW = 360;
    const panelH = 480;
    const panel = makeCard(this, 0, 0, panelW, panelH, 28);
    const title = this.add.text(0, -178, 'Overrun', titleStyle(44, PALETTE.red)).setOrigin(0.5);
    const waveText = this.add.text(0, -130, `Held until wave ${run.wave}`, titleStyle(22)).setOrigin(0.5);
    const score = this.add.text(0, -100, `${run.score} points · ${run.kills} kills`, textStyle(17, PALETTE.muted)).setOrigin(0.5);
    const wavesText = this.add.text(0, -71, `Waves held ${run.wavesCleared}`, textStyle(15, PALETTE.muted)).setOrigin(0.5);
    const stoppedText = this.add.text(0, -54, `Stopped ${run.kills}`, textStyle(15, PALETTE.muted)).setOrigin(0.5);
    const cleanText = this.add.text(0, -37, `Clean ${run.cleanWaves}`, textStyle(15, run.cleanWaves > 0 ? PALETTE.greenDeep : PALETTE.muted)).setOrigin(0.5);
    const coinsText = this.add.text(0, -20, `+${result.coins} coins`, textStyle(15, PALETTE.goldText, { fontStyle: 'bold' })).setOrigin(0.5);
    if (result.coins > 0) {
      coinsText.setScale(1.15);
      this.tweens.add({ targets: coinsText, scale: 1, duration: 150, ease: 'Quad.easeOut' });
      getSfx(this)?.chime();
    }
    const bestText = this.add
      .text(0, 8, result.newBest ? 'New best!' : `Best: wave ${result.profile.bestWave}`, textStyle(15, result.newBest ? PALETTE.greenDeep : PALETTE.faint, { fontStyle: 'bold' }))
      .setOrigin(0.5);
    const claimButton = makeButton(this, 0, 70, 'Claim rewards', claim, { width: 240, height: 56, radius: 28, fill: PALETTE.ink });
    const againButton = makeButton(this, 0, 134, 'Play again', again, { width: 240, height: 56, radius: 28, fill: PALETTE.ink });
    const menuButton = makeButton(this, 0, 196, 'Menu', () => this.scene.start(SCENES.menu), { width: 240, height: 52, radius: 26 });
    const box = this.add.container(0, 0, [
      panel,
      title,
      waveText,
      score,
      wavesText,
      stoppedText,
      cleanText,
      coinsText,
      bestText,
      claimButton.container,
      againButton.container,
      menuButton.container,
    ]);

    const layout = (width: number, height: number): void => {
      box.setPosition(width / 2, height / 2).setScale(Math.min(1, (width - 24) / panelW, (height - 24) / panelH));
    };
    layout(viewSize(this).width, viewSize(this).height);
    onResize(this, layout);
    onKey(this, (e) => {
      if (e.key === 'Enter' || e.key === ' ') again();
    });
    if (flags.smoke) this.time.delayedCall(1500, again);
  }
}
