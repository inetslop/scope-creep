import Phaser from 'phaser';
import { ART, artScale, COIN_TEXTURE, STAR_TEXTURE } from '../art/textures';
import { cssColor, PALETTE } from '../content/palette';
import { cleanWavePay } from '../content/tech/claim';
import { boardCode } from '../core/boardCode';
import { levelMultiplierLabel } from '../core/levels';
import { coinsForRun, loadProfile } from '../core/profile';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { Board } from '../systems/Board';
import { makeButton } from '../ui/button';
import { makeCard } from '../ui/card';
import { display, uiCamera, viewSize } from '../ui/display';
import { textStyle, titleStyle } from '../ui/text';
import { getRun, onResize, SCENES } from './keys';

/** The coin icon beside "+N coins": its shown size (the 28-unit texture at artScale 1.5) and the small fixed gap. */
const COIN_SIZE = 14;
const COIN_GAP = 10;

/**
 * One tidy column: each line's center y below the one before it (its height plus its gap),
 * with the card's padding above the first line and below the last. `ys[i]` is the card-relative
 * center of line i (card top at 0); `height` is the card's height.
 */
function stack(rows: ReadonlyArray<{ height: number; after: number }>, pad: number): { ys: number[]; height: number } {
  let y = pad;
  const ys: number[] = [];
  rows.forEach((row, i) => {
    ys.push(y + row.height / 2);
    y += row.height + (i === rows.length - 1 ? 0 : row.after);
  });
  return { ys, height: y + pad };
}

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
  private ironTag?: Phaser.GameObjects.Text;

  constructor() {
    super(SCENES.rewards);
  }

  create(): void {
    uiCamera(this);
    hook.scene = SCENES.game;
    hook.overlay = SCENES.rewards;
    this.cameras.main.setBackgroundColor(cssColor(PALETTE.ground));
    const run = getRun(this);
    const profile = loadProfile(window.localStorage);
    const lastRun = profile.lastRun;
    const cleanPay = cleanWavePay(profile.purchased);
    const mul = run.mode === 'iron' ? 2 : 1; // Iron pays the doubled formula: node terms first, then doubled
    this.waves = lastRun ? lastRun.wave : run.wavesCleared;
    this.stopped = run.kills; // the ledger stores no stopped count; the card printed run.kills
    this.clean = run.cleanWaves;
    this.combo = run.bestCombo;
    this.score = run.finalScore; // the same number the end-of-run screen shows
    this.coins = lastRun ? lastRun.coins : coinsForRun({ waves: run.wavesCleared, stopped: run.kills, clean: run.cleanWaves, seed: run.seed, bgen: run.bgen }, cleanPay, mul, run.levelHpMul);
    this.elapsed = 0;
    this.cleanText = undefined;
    this.comboText = undefined;
    this.ironTag = undefined; // the scene instance is reused between runs; a tag from an Iron run must not linger
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

    const panelW = 360;
    const pad = 28; // the card's padding, above the title and below the Menu button
    const gapSmall = 12; // inside a group
    const gapBig = 24; // between groups
    const maxW = panelW - 2 * pad; // no line may run past the card inside its padding
    const RECIPE_SIZE = 16;

    /** A muted breakdown line: smaller than the line it explains, shrunk to fit the card (never below 13px). */
    const recipe = (text: string): Phaser.GameObjects.Text => {
      const t = this.add.text(0, 0, text, titleStyle(RECIPE_SIZE, PALETTE.muted)).setOrigin(0.5);
      if (t.width > maxW) t.setFontSize(`${Math.max(13, Math.floor((RECIPE_SIZE * maxW) / t.width))}px`);
      return t;
    };

    const title = this.add.text(0, 0, 'Rewards', titleStyle(32)).setOrigin(0.5);
    this.wavesText = this.add.text(0, 0, 'Waves held 0', titleStyle(22)).setOrigin(0.5);
    this.stoppedText = this.add.text(0, 0, 'Stopped 0', titleStyle(22)).setOrigin(0.5);
    if (run.cleanWaves > 0) this.cleanText = this.add.text(0, 0, 'Clean 0', titleStyle(22, PALETTE.greenDeep)).setOrigin(0.5);
    if (run.bestCombo >= 2) this.comboText = this.add.text(0, 0, 'Best combo ×0', titleStyle(22, run.bestCombo >= 10 ? PALETTE.yellow : PALETTE.muted)).setOrigin(0.5);
    this.scoreText = this.add.text(0, 0, 'Score 0', titleStyle(22)).setOrigin(0.5);
    const scoreRecipe = recipe(`waves +${run.wavesCleared * 100} · stopped +${run.kills}${run.levelHpMul > 1 ? ` · ${levelMultiplierLabel(run.level)}` : ''}`);
    this.coinText = this.add.text(0, 0, '+0 coins', titleStyle(28, PALETTE.goldText)).setOrigin(0.5);
    this.coinIcon = artScale(this.add.image(0, 0, COIN_TEXTURE), 1.5);
    const coinRecipe = recipe(`waves +${this.waves * mul} · stopped +${Math.floor(this.stopped / 10) * mul} · clean +${this.clean * cleanPay * mul}`);
    // The one factor both totals wear, said once under the coins; a create()-local like the iron tag,
    // so a line from a level run cannot linger into a next run's card.
    const levelLine = run.levelHpMul > 1 ? recipe(`${levelMultiplierLabel(run.level)} level augments`) : undefined;
    const boardText = this.add.text(0, 0, `Board ${boardCode(run.seed)}`, titleStyle(22, PALETTE.muted)).setOrigin(0.5);
    let flawlessText: Phaser.GameObjects.Text | undefined;
    let flawlessStar: Phaser.GameObjects.Image | undefined;
    if (flawless) {
      flawlessText = this.add.text(0, 0, 'Flawless', titleStyle(22, PALETTE.muted)).setOrigin(0.5);
      flawlessStar = artScale(this.add.image(0, 0, STAR_TEXTURE), 1.5);
    }
    const menuButton = makeButton(this, 0, 0, 'Menu', menu, { width: 240, height: 52, radius: 26 });

    // The column's groups: the title; the run; the score and its recipe; the coins and their
    // recipe; the board code (and Flawless); the Menu button.
    const rows: Array<{ height: number; after: number }> = [
      { height: title.height, after: gapBig },
      { height: this.wavesText.height, after: gapSmall },
      { height: this.stoppedText.height, after: this.cleanText || this.comboText ? gapSmall : gapBig },
    ];
    if (this.cleanText) rows.push({ height: this.cleanText.height, after: this.comboText ? gapSmall : gapBig });
    if (this.comboText) rows.push({ height: this.comboText.height, after: gapBig });
    rows.push(
      { height: this.scoreText.height, after: gapSmall },
      { height: scoreRecipe.height, after: gapBig },
      { height: this.coinText.height, after: gapSmall },
    );
    if (levelLine) rows.push({ height: levelLine.height, after: gapSmall });
    rows.push(
      { height: coinRecipe.height, after: gapBig },
      { height: boardText.height, after: flawlessText ? gapSmall : gapBig },
    );
    if (flawlessText) rows.push({ height: flawlessText.height, after: gapBig });
    rows.push({ height: menuButton.container.height, after: 0 });

    const col = stack(rows, pad);
    const top = -col.height / 2; // the column is centered on the box's origin, so the card's top sits here
    const panel = makeCard(this, 0, 0, panelW, col.height, 28);
    title.setY(top + col.ys[0]);
    this.wavesText.setY(top + col.ys[1]);
    if (run.mode === 'iron') {
      // Nothing else says which mode the run was: a small muted tag beside the waves line.
      this.ironTag = this.add.text(0, 0, 'Iron', textStyle(13, PALETTE.muted, { fontStyle: 'bold' })).setOrigin(0.5);
      this.ironTag.setY(top + col.ys[1]);
      this.ironTag.setX(this.wavesText.width / 2 + 8 + this.ironTag.width / 2);
    }
    this.stoppedText.setY(top + col.ys[2]);
    let i = 3;
    if (this.cleanText) this.cleanText.setY(top + col.ys[i++]);
    if (this.comboText) this.comboText.setY(top + col.ys[i++]);
    this.scoreText.setY(top + col.ys[i++]);
    scoreRecipe.setY(top + col.ys[i++]);
    this.coinText.setY(top + col.ys[i]);
    this.coinIcon.setY(top + col.ys[i]);
    i++;
    if (levelLine) levelLine.setY(top + col.ys[i++]);
    coinRecipe.setY(top + col.ys[i++]);
    boardText.setY(top + col.ys[i++]);
    if (flawlessText && flawlessStar) {
      flawlessText.setY(top + col.ys[i]);
      flawlessStar.setY(top + col.ys[i] + 1).setX(flawlessText.width / 2 + 13); // the texture is painted 1px low
      i++;
    }
    menuButton.container.setY(top + col.ys[i]);
    this.centerCoins();

    const parts: Phaser.GameObjects.GameObject[] = [panel, title, this.wavesText, this.stoppedText];
    if (this.cleanText) parts.push(this.cleanText);
    if (this.comboText) parts.push(this.comboText);
    parts.push(this.scoreText, scoreRecipe, this.coinText, this.coinIcon, coinRecipe, boardText);
    if (levelLine) parts.push(levelLine);
    if (flawlessText && flawlessStar) parts.push(flawlessText, flawlessStar);
    parts.push(menuButton.container);
    if (this.ironTag) parts.push(this.ironTag);
    const box = this.add.container(0, 0, parts).setDepth(2);

    const layout = (width: number, height: number): void => {
      shade.setSize(width, height);
      shade.input?.hitArea.setTo(0, 0, width, height);
      const k = Math.min(((width - 16) * display.ratio) / boardSize.width, ((height - 16) * display.ratio) / boardSize.height);
      artScale(board, k * ART);
      box.setPosition(width / 2, height / 2).setScale(Math.min(1, (width - 24) / panelW, (height - 24) / col.height));
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
    // The number grows while counting up, and the tag sits right of it.
    if (this.ironTag) this.ironTag.setX(this.wavesText.width / 2 + 8 + this.ironTag.width / 2);
    this.stoppedText.setText(`Stopped ${Math.round(this.stopped * k)}`);
    this.cleanText?.setText(`Clean ${Math.round(this.clean * k)}`);
    this.comboText?.setText(`Best combo ×${Math.round(this.combo * k)}`);
    this.scoreText.setText(`Score ${Math.round(this.score * k)}`);
    this.coinText.setText(`+${Math.round(this.coins * kc)} coins`);
    this.centerCoins();
  }

  /** The icon sits right beside "+N coins" and the pair is centered (the number grows while counting up). */
  private centerCoins(): void {
    this.coinText.setX((COIN_SIZE + COIN_GAP) / 2);
    this.coinIcon.setX(-this.coinText.width / 2 - COIN_GAP / 2 - COIN_SIZE / 2);
  }
}
