import type Phaser from 'phaser';
import { PANIC_COST } from '../../config';
import { cssColor, PALETTE } from '../../content/palette';
import { artScale, COIN_TEXTURE } from '../../art/textures';
import type { GameScene } from '../../scenes/GameScene';
import { getSfx } from '../../scenes/keys';
import { makeButton, type Button } from '../button';
import { textStyle } from '../text';
import { EDGE, type HudPart } from './hud';

/**
 * Under the stats card, only while the wave is on: pay the panic and every enemy on the board
 * vanishes — soft rings, one whoosh, no gold paid back. Spent once per wave.
 */
export class PanicButton implements HudPart {
  private readonly button: Button;
  private readonly coin: Phaser.GameObjects.Image;
  private readonly word: Phaser.GameObjects.Text;
  private readonly price: Phaser.GameObjects.Text;
  private shown = false;
  private state = '';

  constructor(scene: Phaser.Scene, game: GameScene) {
    this.button = makeButton(scene, 0, 0, '', () => this.pulse(game), { width: 148, height: 48, radius: 14, fadeWhenDisabled: false });
    this.coin = artScale(scene.add.image(0, 0, COIN_TEXTURE), 12 / 28);
    this.word = scene.add.text(0, 0, '', textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    this.price = scene.add.text(0, 0, '', textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    this.word.setText('Panic ·');
    this.button.content.add([this.coin, this.word, this.price]);
    this.refresh(game);
    this.centerRow();
  }

  layout(): void {
    // Under the stats card, which tops out at y = 84.
    this.button.container.setPosition(EDGE + 98, 84 + 10 + 24);
  }

  update(game: GameScene): void {
    this.refresh(game);
  }

  /** The button is shown while the wave is on; the price goes red below the cost, "used" after it. */
  private refresh(game: GameScene): void {
    const wave = game.run.phase === 'wave';
    if (this.shown !== wave) {
      this.shown = wave;
      this.button.container.setVisible(this.shown);
      if (this.shown) this.state = ''; // a new wave: never show the old "used" from the last one
    }
    const s: 'used' | 'ready' | 'poor' = game.run.panicUsed ? 'used' : game.run.canAfford(PANIC_COST) ? 'ready' : 'poor';
    if (s === this.state) return;
    this.state = s;
    const priceText = s === 'used' ? 'used' : String(PANIC_COST);
    if (this.price.text !== priceText) {
      this.price.setText(priceText);
      this.centerRow();
    }
    this.word.setColor(cssColor(s === 'used' ? PALETTE.muted : PALETTE.ink));
    this.price.setColor(cssColor(s === 'used' ? PALETTE.muted : s === 'poor' ? PALETTE.red : PALETTE.ink));
    this.button.content.setAlpha(s === 'used' ? 0.5 : s === 'poor' ? 0.6 : 1);
  }

  /** Coin, word and price sit side by side, the row centered in the button. */
  private centerRow(): void {
    const w = 12 + 8 + this.word.width + 6 + this.price.width;
    this.coin.x = -w / 2 + 6;
    this.word.x = -w / 2 + 20;
    this.price.x = this.word.x + this.word.width + 6;
  }

  /** Pay the pulse and wipe the board: soft rings where the enemies were, the whoosh once. */
  private pulse(game: GameScene): void {
    if (game.run.phase !== 'wave' || !game.run.panic(PANIC_COST)) return;
    for (const e of game.enemies.all) {
      if (!e.active) continue;
      game.fx.panicFlash(e.x, e.y);
      e.despawn();
    }
    getSfx(game)?.panic();
  }
}
