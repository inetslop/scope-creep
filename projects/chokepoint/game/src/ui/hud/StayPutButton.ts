import type Phaser from 'phaser';
import { artScale, COIN_TEXTURE } from '../../art/textures';
import { cssColor, PALETTE } from '../../content/palette';
import { STAY_PUT } from '../../config';
import type { GameScene } from '../../scenes/GameScene';
import { makeButton, type Button } from '../button';
import { textStyle } from '../text';
import { EDGE, SEND_BTN, type HudPart } from './hud';
import type { NextWavePreview } from './NextWavePreview';

const MIN_W = 140; // the "Stay put · 5" row needs this even when the preview card is one enemy wide

/**
 * Under the wave preview card while the build phase runs: "Stay put · 5" spends 5 gold for 3 more
 * build seconds, once per build phase (the mirror of sending early: the big button sells the
 * seconds for gold, this buys them back). Red number while the run has less than 5 gold (the
 * can't-afford look); spent it reads "used" (the reroll's look) until the next build phase.
 */
export class StayPutButton implements HudPart {
  private readonly scene: Phaser.Scene;
  private readonly game: GameScene;
  private readonly preview: NextWavePreview;
  private row: { button: Button; word: Phaser.GameObjects.Text; coin: Phaser.GameObjects.Image; price: Phaser.GameObjects.Text } | undefined;
  private builtW = 0;
  private width = 0;
  private used = false;
  private lastPhase = '';

  constructor(scene: Phaser.Scene, game: GameScene, preview: NextWavePreview) {
    this.scene = scene;
    this.game = game;
    this.preview = preview;
  }

  layout(width: number): void {
    this.width = width;
  }

  update(game: GameScene): void {
    if (game.run.phase === 'build' && this.lastPhase !== 'build') this.used = false; // each build phase gets its one buy
    this.lastPhase = game.run.phase;
    const rect = this.preview.rect; // hidden whenever the preview card above is
    if (!rect) {
      this.row?.button.container.setVisible(false);
      return;
    }
    const w = Math.max(rect.width, MIN_W);
    if (!this.row || this.builtW !== w) this.rebuild(w);
    const r = this.row!;
    r.button.container.setVisible(true);
    r.button.container.setPosition(Math.min(rect.x, this.width - EDGE - w / 2), rect.y + rect.height / 2 + SEND_BTN.gap + SEND_BTN.height / 2);
    const afford = game.run.gold >= STAY_PUT.cost;
    r.price.setText(this.used ? 'used' : String(STAY_PUT.cost));
    r.word.setColor(cssColor(this.used ? PALETTE.muted : PALETTE.ink));
    r.price.setColor(cssColor(this.used ? PALETTE.muted : afford ? PALETTE.ink : PALETTE.red));
    r.button.setEnabled(!this.used && afford);
    r.button.content.setAlpha(this.used ? 0.5 : afford ? 1 : 0.6); // the reroll's used / can't-afford looks, no fade (fadeWhenDisabled: false)
    const rw = 12 + 8 + r.word.width + 6 + r.price.width;
    r.coin.x = -rw / 2 + 6;
    r.word.x = -rw / 2 + 20;
    r.price.x = r.word.x + r.word.width + 6;
  }

  private rebuild(w: number): void { // the Send row's look, with a fixed price
    this.row?.button.container.destroy(); // the card and the whole row are its children
    const scene = this.scene;
    const button = makeButton(scene, 0, 0, '', () => this.press(), { width: w, height: SEND_BTN.height, fadeWhenDisabled: false });
    const word = scene.add.text(0, 0, 'Stay put ·', textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    const coin = artScale(scene.add.image(0, 0, COIN_TEXTURE), 12 / 28);
    const price = scene.add.text(0, 0, String(STAY_PUT.cost), textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    button.content.add([word, coin, price]);
    this.row = { button, word, coin, price };
    this.builtW = w;
  }

  private press(): void { // the buy pops a red "-5" from the button, in screen space
    if (!this.game.flow.buyBuildTime()) return;
    this.used = true; // spent it: the reroll's "used" look until the next build phase
    const b = this.row?.button;
    if (!b) return;
    const y = b.container.y - SEND_BTN.height / 2 - 18;
    const t = this.scene.add.text(b.container.x, y, `-${STAY_PUT.cost}`, textStyle(22, PALETTE.red, { fontStyle: 'bold', stroke: cssColor(PALETTE.card), strokeThickness: 6 })).setOrigin(0.5);
    this.scene.tweens.add({ targets: t, y: y - 34, alpha: 0, duration: 750, ease: 'Quad.easeOut', onComplete: () => t.destroy() });
  }
}
