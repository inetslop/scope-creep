import type Phaser from 'phaser';
import { artScale, COIN_TEXTURE } from '../../art/textures';
import { cssColor, PALETTE } from '../../content/palette';
import type { GameScene } from '../../scenes/GameScene';
import { makeButton, type Button } from '../button';
import { textStyle } from '../text';
import { EDGE, SEND_BTN, type HudPart } from './hud';
import type { NextWavePreview } from './NextWavePreview';

const MIN_W = 140; // the "Send · +N" row needs this even when the preview card is one enemy wide

/** Under the wave preview card while the build phase runs: "Send · +N" starts the wave now and banks
 * 2 gold per whole second left (N falls by 2 each second). Dimmed with a red number while N is more
 * gold than the run has (the reroll's can't-afford look); the wave is the planned one. */
export class SendButton implements HudPart {
  private readonly scene: Phaser.Scene;
  private readonly game: GameScene;
  private readonly preview: NextWavePreview;
  private row: { button: Button; word: Phaser.GameObjects.Text; coin: Phaser.GameObjects.Image; price: Phaser.GameObjects.Text } | undefined;
  private builtW = 0;
  private width = 0;

  constructor(scene: Phaser.Scene, game: GameScene, preview: NextWavePreview) {
    this.scene = scene;
    this.game = game;
    this.preview = preview;
  }

  layout(width: number): void {
    this.width = width;
  }

  update(game: GameScene): void {
    const rect = this.preview.rect; // the card's screen rect, or none while it is hidden
    if (!rect) {
      this.row?.button.container.setVisible(false);
      return;
    }
    const w = Math.max(rect.width, MIN_W);
    if (!this.row || this.builtW !== w) this.rebuild(w);
    const r = this.row!;
    r.button.container.setVisible(true);
    r.button.container.setPosition(Math.min(rect.x, this.width - EDGE - w / 2), rect.y + rect.height / 2 + SEND_BTN.gap + SEND_BTN.height / 2);
    const n = Math.max(0, Math.floor(game.run.buildLeftSec)) * 2; // 30 s left reads "+60", falls by 2 each second
    r.price.setText(`+${n}`);
    const afford = game.run.gold >= n;
    r.button.setEnabled(afford);
    r.price.setColor(cssColor(afford ? PALETTE.ink : PALETTE.red));
    r.button.content.setAlpha(afford ? 1 : 0.6);
    const rw = 12 + 8 + r.word.width + 6 + r.price.width;
    r.coin.x = -rw / 2 + 6;
    r.word.x = -rw / 2 + 20;
    r.price.x = r.word.x + r.word.width + 6;
  }

  private rebuild(w: number): void {
    this.row?.button.container.destroy(); // card, ring and the whole row are its children
    const scene = this.scene;
    const button = makeButton(scene, 0, 0, '', () => this.press(), { width: w, height: SEND_BTN.height, fadeWhenDisabled: false });
    const word = scene.add.text(0, 0, 'Send ·', textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    const coin = artScale(scene.add.image(0, 0, COIN_TEXTURE), 12 / 28);
    const price = scene.add.text(0, 0, '+0', textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    button.content.add([word, coin, price]);
    this.row = { button, word, coin, price };
    this.builtW = w;
  }

  private press(): void {
    const banked = this.game.flow.sendNow(); // 0 in the last partial second: just starts the wave
    if (banked <= 0) return;
    const b = this.row?.button;
    if (!b) return;
    const y = b.container.y - SEND_BTN.height / 2 - 18;
    const t = this.scene.add.text(b.container.x, y, `+${banked}`, textStyle(22, PALETTE.goldText, { fontStyle: 'bold', stroke: cssColor(PALETTE.card), strokeThickness: 6 })).setOrigin(0.5);
    this.scene.tweens.add({ targets: t, y: y - 34, alpha: 0, duration: 750, ease: 'Quad.easeOut', onComplete: () => t.destroy() }); // the kill-gold pop
  }
}
