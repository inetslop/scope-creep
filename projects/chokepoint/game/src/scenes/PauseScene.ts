import Phaser from 'phaser';
import { PALETTE } from '../content/palette';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { makeButton } from '../ui/button';
import { makeCard } from '../ui/card';
import { titleStyle } from '../ui/text';
import { uiCamera, viewSize } from '../ui/display';
import { getGameScene, onKey, onResize, SCENES } from './keys';

/** Pause overlay: resume or quit, on one card. In ?smoke mode it resumes on its own. */
export class PauseScene extends Phaser.Scene {
  constructor() {
    super(SCENES.pause);
  }

  create(): void {
    uiCamera(this);
    hook.overlay = SCENES.pause;
    const game = getGameScene(this);
    let closed = false;
    const resume = (): void => {
      if (closed) return;
      closed = true;
      hook.overlay = '';
      this.scene.stop();
      game.closePause();
    };
    const quit = (): void => {
      if (closed) return;
      closed = true;
      hook.overlay = '';
      this.scene.stop(SCENES.hud);
      this.scene.stop(SCENES.game);
      this.scene.start(SCENES.menu);
    };

    const shade = this.add.rectangle(0, 0, 10, 10, PALETTE.ground, 0.78).setOrigin(0).setInteractive();
    const panelW = 360;
    const panelH = 260;
    const panel = makeCard(this, 0, 0, panelW, panelH, 28);
    const title = this.add.text(0, -panelH / 2 + 48, 'Paused', titleStyle(34)).setOrigin(0.5);
    const resumeButton = makeButton(this, 0, -panelH / 2 + 124, 'Resume', resume, { width: 240, height: 56, radius: 28, fill: PALETTE.ink });
    const quitButton = makeButton(this, 0, -panelH / 2 + 196, 'Quit run', quit, { width: 240, height: 52, radius: 26 });
    const box = this.add.container(0, 0, [panel, title, resumeButton.container, quitButton.container]);

    const layout = (width: number, height: number): void => {
      shade.setSize(width, height);
      shade.input?.hitArea.setTo(0, 0, width, height);
      box.setPosition(width / 2, height / 2).setScale(Math.min(1, (width - 24) / panelW, (height - 24) / panelH));
    };
    layout(viewSize(this).width, viewSize(this).height);
    onResize(this, layout);
    onKey(this, (e) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') resume();
    });
    if (flags.smoke) this.time.delayedCall(1000, resume);
  }
}
