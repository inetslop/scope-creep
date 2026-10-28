import Phaser from 'phaser';
import { ART, artScale, COIN_TEXTURE, STAR_TEXTURE } from '../art/textures';
import { cssColor, PALETTE } from '../content/palette';
import { boardCode } from '../core/boardCode';
import { coinsForRun, loadProfile } from '../core/profile';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { Board } from '../systems/Board';
import { makeButton } from '../ui/button';
import { makeCard } from '../ui/card';
import { display, uiCamera, viewSize } from '../ui/display';
import { titleStyle } from '../ui/text';
import { getRun, onResize, SCENES } from './keys';

/**
 * The claim moment: the run's board dimmed behind, one card counting up what the run earned.
 * The numbers are read from the saved run (the ledger), never recomputed; in ?smoke mode the
 * scene returns to the menu on its own.
 */
export class RewardsScene extends Phaser.Scene {
  private waves = 0;
  private stopped = 0;
  private clean = 0;
  private combo = 0;
  private score = 0;
  private coins = 0;
  private elapsed = 0;
  private wavesText!: Phaser.GameObjects.Text;
  private stoppedText!: Phaser.GameObjects.Text;
  private cleanText?: Phaser.GameObjects.Text;
  private comboText?: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;
  private coinIcon!: Phaser.GameObjects.Image;

  constructor() {
    super(SCENES.rewards);
  }

  create(): void {
    uiCamera(this);
    hook.scene = SCENES.game;
    hook.overlay = SCENES.rewards;
    this.cameras.main.setBackgroundColor(cssColor(PALETTE.ground));
    const run = getRun(this);
    const lastRun = loadProfile(window.localStorage).lastRun;
    this.waves = lastRun ? lastRun.wave : run.wavesCleared;
    this.stopped = run.kills; // the ledger stores no stopped count; the card printed run.kills
    this.clean = run.cleanWaves;
    this.combo = run.bestCombo;
    this.score = run.score; // the same number the end-of-run screen shows
    this.coins = lastRun ? lastRun.coins : coinsForRun({ waves: run.wavesCleared, stopped: run.kills, clean: run.cleanWaves });
    this.elapsed = 0;
    this.cleanText = undefined;
    this.comboText = undefined;
    const flawless = this.waves === this.clean && this.waves > 0; // every held wave was clean
    let closed = false;
    const menu = (): void => {
      if (closed) return;
      closed = true;
      hook.overlay = '';
      this.scene.stop(SCENES.hud);
      this.scene.stop(SCENES.game);
      this.scene.start(SCENES.menu);
    };

    // The run's board behind the shade, static (GameScene is stopped at game over, so the
    // texture can only be repainted by a next run, which rewards makes unreachable).
    // The base frame spans the whole texture.
    const boardSize = this.textures.get(Board.TEXTURE).get();
    const board = this.add.image(0, 0, Board.TEXTURE).setDepth(0);
    const shade = this.add.rectangle(0, 0, 10, 10, PALETTE.ground, 0.78).setOrigin(0).setDepth(1).setInteractive();

    const mid = 1 + (run.cleanWaves > 0 ? 1 : 0) + (run.bestCombo >= 2 ? 1 : 0); // middle lines: Score always, Clean and Best combo when they were earned
    const dy = 18 * mid; // each middle line: top half up 18, bottom half down 18, panel grows 36
    const panelW = 360;
    const panelH = 372 + 2 * dy + 72 + (flawless ? 72 : 0); // bottom lines: the recipe, and the Flawless line when flawless; the centered card grows 72 per one so the button's 36 drop stays inside
    const panel = makeCard(this, 0, 0, panelW, panelH, 28);
    const title = this.add.text(0, -98 - dy, 'Rewards', titleStyle(32)).setOrigin(0.5);
    this.wavesText = this.add.text(0, -44 - dy, 'Waves held 0', titleStyle(22)).setOrigin(0.5);
    this.stoppedText = this.add.text(0, -8 - dy, 'Stopped 0', titleStyle(22)).setOrigin(0.5);
    if (run.cleanWaves > 0) this.cleanText = this.add.text(0, 28 - dy, 'Clean 0', titleStyle(22, PALETTE.greenDeep)).setOrigin(0.5);
    if (run.bestCombo >= 2) this.comboText = this.add.text(0, 28 - dy + (run.cleanWaves > 0 ? 36 : 0), 'Best combo ×0', titleStyle(22, run.bestCombo >= 10 ? PALETTE.yellow : PALETTE.muted)).setOrigin(0.5);
    this.scoreText = this.add.text(0, 28 - dy + (run.cleanWaves > 0 ? 36 : 0) + (run.bestCombo >= 2 ? 36 : 0), 'Score 0', titleStyle(22)).setOrigin(0.5);
    this.coinText = this.add.text(0, 44 + dy, '+0 coins', titleStyle(28, PALETTE.goldText)).setOrigin(0.5);
    this.coinIcon = artScale(this.add.image(0, 44 + dy, COIN_TEXTURE), 1.5);
    const recipeText = this.add.text(0, 80 + dy, `waves +${this.waves} · stopped +${Math.floor(this.stopped / 10)} · clean +${this.clean}`, titleStyle(22, PALETTE.muted)).setOrigin(0.5);
    const boardText = this.add.text(0, 116 + dy, `Board ${boardCode(run.seed)}`, titleStyle(22, PALETTE.muted)).setOrigin(0.5);
    let flawlessText: Phaser.GameObjects.Text | undefined;
    let flawlessStar: Phaser.GameObjects.Image | undefined;
    if (flawless) {
      flawlessText = this.add.text(0, 152 + dy, 'Flawless', titleStyle(22, PALETTE.muted)).setOrigin(0.5);
      flawlessStar = artScale(this.add.image(flawlessText.width / 2 + 13, 153 + dy, STAR_TEXTURE));
    }
    const menuButton = makeButton(this, 0, 180 + dy + (flawless ? 36 : 0), 'Menu', menu, { width: 240, height: 52, radius: 26 });
    const parts: Phaser.GameObjects.GameObject[] = [panel, title, this.wavesText, this.stoppedText];
    if (this.cleanText) parts.push(this.cleanText);
    if (this.comboText) parts.push(this.comboText);
    parts.push(this.scoreText, this.coinText, this.coinIcon, recipeText, boardText);
    if (flawlessText && flawlessStar) parts.push(flawlessText, flawlessStar);
    parts.push(menuButton.container);
    const box = this.add.container(0, 0, parts).setDepth(2);

    const layout = (width: number, height: number): void => {
      shade.setSize(width, height);
      shade.input?.hitArea.setTo(0, 0, width, height);
      const k = Math.min(((width - 16) * display.ratio) / boardSize.width, ((height - 16) * display.ratio) / boardSize.height);
      artScale(board, k * ART);
      box.setPosition(width / 2, height / 2).setScale(Math.min(1, (width - 24) / panelW, (height - 24) / panelH));
    };
    layout(viewSize(this).width, viewSize(this).height);
    onResize(this, layout);
    if (flags.smoke) this.time.delayedCall(1500, menu);
  }

  update(_time: number, deltaMs: number): void {
    this.elapsed += Math.min(deltaMs / 1000, 0.05);
    const k = Math.min(1, this.elapsed / 0.6);
    const kc = Math.min(1, this.elapsed / 1.0);
    this.wavesText.setText(`Waves held ${Math.round(this.waves * k)}`);
    this.stoppedText.setText(`Stopped ${Math.round(this.stopped * k)}`);
    this.cleanText?.setText(`Clean ${Math.round(this.clean * k)}`);
    this.comboText?.setText(`Best combo ×${Math.round(this.combo * k)}`);
    this.scoreText.setText(`Score ${Math.round(this.score * k)}`);
    this.coinText.setText(`+${Math.round(this.coins * kc)} coins`);
    this.coinIcon.setX(-this.coinText.width / 2 - 33); // the coin sits left of the number; the row stays centered
  }
}
