import Phaser from 'phaser';
import { cssColor, PALETTE } from '../content/palette';
import { loadBest, saveIfBest } from '../core/bestScore';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { makeButton } from '../ui/button';
import { makeCard } from '../ui/card';
import { uiCamera, viewSize } from '../ui/display';
import { textStyle, titleStyle } from '../ui/text';
import { getRun, onKey, onResize, SCENES } from './keys';

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
    const result = { wave: run.wave, score: run.score };
    const isBest = saveIfBest(window.localStorage, result);
    const best = loadBest(window.localStorage);
    const again = (): void => {
      this.scene.start(SCENES.game);
    };

    const panelW = 360;
    const panelH = 380;
    const panel = makeCard(this, 0, 0, panelW, panelH, 28);
    const title = this.add.text(0, -panelH / 2 + 56, 'Overrun', titleStyle(44, PALETTE.red)).setOrigin(0.5);
    const waveText = this.add.text(0, -panelH / 2 + 118, `Held until wave ${run.wave}`, titleStyle(22)).setOrigin(0.5);
    const score = this.add.text(0, -panelH / 2 + 152, `${run.score} points · ${run.kills} kills`, textStyle(17, PALETTE.muted)).setOrigin(0.5);
    const bestText = this.add
      .text(0, -panelH / 2 + 186, isBest ? 'New best!' : `Best: wave ${best.wave} · ${best.score} points`, textStyle(15, isBest ? PALETTE.greenDeep : PALETTE.faint, { fontStyle: 'bold' }))
      .setOrigin(0.5);
    const againButton = makeButton(this, 0, panelH / 2 - 112, 'Play again', again, { width: 240, height: 56, radius: 28, fill: PALETTE.ink });
    const menuButton = makeButton(this, 0, panelH / 2 - 46, 'Menu', () => this.scene.start(SCENES.menu), { width: 240, height: 52, radius: 26 });
    const box = this.add.container(0, 0, [panel, title, waveText, score, bestText, againButton.container, menuButton.container]);

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
