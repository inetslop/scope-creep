import type Phaser from 'phaser';
import { HUD } from '../../config';
import { PALETTE } from '../../content/palette';
import { cardTexture, makeCard } from '../card';
import { textStyle } from '../text';
import { isNarrow } from './hud';

const W = 140;

/**
 * Top-center card that slides in from above, holds, and fades out (~1 s total) — the wave's
 * moment ("Wave N", from WaveBanner) and, the same way, the last stand banner's two lines:
 * no second card system. Blocks nothing, takes no input; at most one at a time.
 */
export class TopBanner {
  private readonly scene: Phaser.Scene;
  private readonly box: Phaser.GameObjects.Container;
  private readonly card: Phaser.GameObjects.Image;
  private readonly text: Phaser.GameObjects.Text;
  private readonly sub: Phaser.GameObjects.Text;
  private playing = false;
  private top = 12;
  private h = 48;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.card = makeCard(scene, 0, 0, W, 48, 24);
    this.text = scene.add.text(0, 0, '', textStyle(20, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
    this.sub = scene.add.text(0, 14, '', textStyle(13, PALETTE.muted)).setOrigin(0.5).setVisible(false);
    this.box = scene.add.container(0, 0, [this.card, this.text, this.sub]).setVisible(false);
  }

  /** Top center: hanging from the top edge, or clear of the top HUD row on narrow screens. */
  layout(width: number): void {
    this.top = isNarrow(width) ? HUD.top + 24 : 12;
    this.box.setPosition(width / 2, this.top + this.h / 2);
  }

  /** Slides in from above (~200 ms), holds (~500 ms), fades out (~300 ms). No-op while playing. */
  show(lines: string[]): void {
    if (this.playing) return;
    this.playing = true;
    const two = lines.length > 1;
    this.h = two ? 72 : 48; // 72 tall is for T0060's two lines
    this.card.setTexture(cardTexture(this.scene, W, this.h, 24));
    this.text.setText(lines[0]).setY(two ? -12 : 0);
    this.sub.setText(two ? lines[1] : '').setVisible(two);
    this.box.alpha = 1;
    this.box.setVisible(true);
    const y = this.top + this.h / 2;
    this.box.y = y - 96; // starts above the top edge (or above the top row on narrow) and settles down
    this.scene.tweens.add({ targets: this.box, y, duration: 200, ease: 'Quad.easeOut' });
    this.scene.tweens.add({ targets: this.box, alpha: 0, delay: 700, duration: 300, onComplete: () => { this.playing = false; this.box.setVisible(false); } });
  }
}
