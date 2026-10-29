import Phaser from 'phaser';
import { artScale, STAR_TEXTURE } from '../art/textures';
import { cssColor, PALETTE } from '../content/palette';
import { recordRun } from '../core/profile';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { makeButton } from '../ui/button';
import { makeByTowerCard, type ByTowerEntry } from '../ui/byTower';
import { makeCard } from '../ui/card';
import { uiCamera, viewSize } from '../ui/display';
import { textStyle, titleStyle } from '../ui/text';
import { addUpdateNotice } from '../ui/updateNotice';
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
    const result = recordRun(window.localStorage, { waves: run.wavesCleared, stopped: run.kills, clean: run.cleanWaves, seed: run.seed });
    const again = (): void => {
      this.scene.start(SCENES.game);
    };
    const claim = (): void => {
      this.scene.start(SCENES.rewards);
    };

    const panelW = 360;
    const panelH = 497;
    const panel = makeCard(this, 0, 0, panelW, panelH, 28);
    const title = this.add.text(0, -178, 'Overrun', titleStyle(44, PALETTE.red)).setOrigin(0.5);
    const waveText = this.add.text(0, -130, `Held until wave ${run.wave}`, titleStyle(22)).setOrigin(0.5);
    const score = this.add.text(0, -100, `${run.score} points · ${run.kills} kills`, textStyle(17, PALETTE.muted)).setOrigin(0.5);
    const scoreRecipe = this.add.text(0, -80, `waves +${run.wavesCleared * 100} · stopped +${run.kills}`, textStyle(15, PALETTE.muted)).setOrigin(0.5);
    const flawless = run.wavesCleared === run.cleanWaves && run.wavesCleared > 0;
    let flawlessStar: Phaser.GameObjects.Image | undefined;
    if (flawless) flawlessStar = artScale(this.add.image(score.width / 2 + 13, -99, STAR_TEXTURE));
    const wavesText = this.add.text(0, -54, `Waves held ${run.wavesCleared}`, textStyle(15, PALETTE.muted)).setOrigin(0.5);
    const stoppedText = this.add.text(0, -37, `Stopped ${run.kills}`, textStyle(15, PALETTE.muted)).setOrigin(0.5);
    const cleanText = this.add.text(0, -20, `Clean ${run.cleanWaves}`, textStyle(15, run.cleanWaves > 0 ? PALETTE.greenDeep : PALETTE.muted)).setOrigin(0.5);
    const coinsText = this.add.text(0, -3, `+${result.coins} coins`, textStyle(15, PALETTE.goldText, { fontStyle: 'bold' })).setOrigin(0.5);
    if (result.coins > 0) {
      coinsText.setScale(1.15);
      this.tweens.add({ targets: coinsText, scale: 1, duration: 150, ease: 'Quad.easeOut' });
      getSfx(this)?.chime();
    }
    const bestText = this.add
      .text(0, 25, result.newBest ? 'New best!' : `Best: wave ${result.profile.bestWave}`, textStyle(15, result.newBest ? PALETTE.greenDeep : PALETTE.faint, { fontStyle: 'bold' }))
      .setOrigin(0.5);
    const claimButton = makeButton(this, 0, 87, 'Claim rewards', claim, { width: 240, height: 56, radius: 28, fill: PALETTE.ink });
    const againButton = makeButton(this, 0, 151, 'Play again', again, { width: 240, height: 56, radius: 28, fill: PALETTE.ink });
    const menuButton = makeButton(this, 0, 213, 'Menu', () => this.scene.start(SCENES.menu), { width: 240, height: 52, radius: 26 });
    const parts: Phaser.GameObjects.GameObject[] = [panel, title, waveText, score];
    if (flawlessStar) parts.push(flawlessStar);
    parts.push(scoreRecipe, wavesText, stoppedText, cleanText, coinsText, bestText, claimButton.container, againButton.container, menuButton.container);
    const entries = this.registry.get('towerKills') as ByTowerEntry[] | undefined;
    let byTowerH = 0;
    if (entries && entries.length > 0) {
      const built = makeByTowerCard(this, entries);
      built.card.setPosition(0, panelH / 2 + 16 + built.height / 2);
      byTowerH = built.height;
      parts.push(built.card);
    }
    const box = this.add.container(0, 0, parts);
    const bottom = panelH / 2 + (byTowerH ? 16 + byTowerH : 0); // how far the content extends below the panel's center

    const layout = (width: number, height: number): void => {
      box.setPosition(width / 2, height / 2).setScale(Math.min(1, (width - 24) / panelW, (height / 2 - 12) / (panelH / 2), (height / 2 - 12) / bottom));
    };
    layout(viewSize(this).width, viewSize(this).height);
    onResize(this, layout);
    addUpdateNotice(this);
    onKey(this, (e) => {
      if (e.key === 'Enter' || e.key === ' ') again();
    });
    if (flags.smoke) this.time.delayedCall(1500, again);
  }
}
