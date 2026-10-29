import type Phaser from 'phaser';
import { HUD } from '../../config';
import { cssColor, PALETTE } from '../../content/palette';
import type { GameScene } from '../../scenes/GameScene';
import { getSfx } from '../../scenes/keys';
import { artScale, COIN_TEXTURE } from '../../art/textures';
import { makeButton, type Button } from '../button';
import { CARD_RES, cardTexture } from '../card';
import { fillRing } from '../ring';
import { textStyle } from '../text';
import { EDGE, isNarrow, NEXT_SIZE, type HudPart } from './hud';

const BADGE_H = 24;

/**
 * Bottom right: the round ink button. In the build phase it shows a play mark and starts the wave
 * early, banking 2 gold per whole second left (Space too), its teal ring counting down; during a
 * wave it shows how many enemies are left, and its red ring empties with them.
 */
export class NextWaveButton implements HudPart {
  private readonly scene: Phaser.Scene;
  private readonly button: Button;
  private readonly ring: Phaser.GameObjects.Graphics;
  private readonly play: Phaser.GameObjects.Graphics;
  private readonly left: Phaser.GameObjects.Text;
  private readonly title: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  private readonly badge: Phaser.GameObjects.Container;
  private readonly badgeCard: Phaser.GameObjects.Image;
  private readonly badgeCoin: Phaser.GameObjects.Image;
  private readonly badgeText: Phaser.GameObjects.Text;
  private badgeW = 0;
  private narrow = false;
  /** The most enemies seen left this wave: the full ring. */
  private waveSize = 1;
  /** The last number shown: a change to 3, 2 or 1 is the build break's soft blip. */
  private lastShown = -1;

  constructor(scene: Phaser.Scene, game: GameScene) {
    this.scene = scene;
    this.ring = scene.add.graphics();
    this.button = makeButton(scene, 0, 0, '', () => {
      const banked = game.flow.startWaveNow();
      if (banked > 0) this.popGold(banked);
    }, { width: NEXT_SIZE, height: NEXT_SIZE, radius: NEXT_SIZE / 2, fill: PALETTE.ink, fadeWhenDisabled: false });
    this.play = scene.add.graphics();
    this.play.fillStyle(PALETTE.card, 1);
    this.play.fillTriangle(-8, -13, -8, 13, 14, 0);
    this.left = scene.add.text(0, 0, '', textStyle(24, PALETTE.card, { fontStyle: 'bold' })).setOrigin(0.5);
    this.button.content.add([this.play, this.left]);
    this.title = scene.add.text(0, 0, '', textStyle(16, PALETTE.ink, { fontStyle: 'bold', align: 'right' })).setOrigin(1, 1);
    this.hint = scene.add.text(0, 0, '', textStyle(13, PALETTE.muted, { align: 'right' })).setOrigin(1, 0);
    this.badgeCard = scene.add.image(0, 0, cardTexture(scene, 40, BADGE_H, BADGE_H / 2)).setScale(1 / CARD_RES);
    this.badgeCoin = artScale(scene.add.image(0, 0, COIN_TEXTURE), 12 / 28);
    this.badgeText = scene.add.text(0, 0, '+0', textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    this.badge = scene.add.container(0, 0, [this.badgeCard, this.badgeCoin, this.badgeText]).setVisible(false);
  }

  layout(width: number, height: number): void {
    this.narrow = isNarrow(width);
    const bottom = height - HUD.bottom / 2;
    const x = width - EDGE - NEXT_SIZE / 2 - 4;
    this.button.container.setPosition(x, bottom);
    this.ring.setPosition(x, bottom);
    if (this.narrow) {
      this.title.setOrigin(0.5, 1).setPosition(x, bottom - NEXT_SIZE / 2 - 22);
      this.hint.setVisible(false);
    } else {
      this.title.setOrigin(1, 1).setPosition(x - NEXT_SIZE / 2 - 14, bottom + 2);
      this.hint.setOrigin(1, 0).setPosition(x - NEXT_SIZE / 2 - 14, bottom + 4).setVisible(true);
    }
  }

  update(game: GameScene): void {
    const run = game.run;
    const ring = this.ring;
    ring.clear();
    const r = NEXT_SIZE / 2 + 7;
    const tau = Math.PI * 2;
    fillRing(ring, 0, 0, r, 5, 0, tau, PALETTE.ink, 0.1);
    if (run.phase === 'build') {
      const secs = Math.max(0, Math.ceil(run.buildLeftSec));
      if (this.lastShown !== secs) {
        this.lastShown = secs;
        if (secs >= 1 && secs <= 3) getSfx(game)?.blip();
      }
      fillRing(ring, 0, 0, r, 5, 0, (Math.max(0, run.buildLeftSec) / (game.flow.buildTotalSec || 1)) * tau, PALETTE.teal);
      this.title.setText(this.narrow ? `Wave ${run.wave + 1} · ${secs}s` : `Wave ${run.wave + 1}`);
      this.hint.setText(`in ${secs}s · Space`);
      this.button.setEnabled(true);
      this.play.setVisible(true);
      this.left.setVisible(false);
      this.waveSize = 1;
      this.refreshBadge(Math.max(0, Math.floor(run.buildLeftSec)) * 2);
      return;
    }
    const leftCount = game.flow.enemiesLeft;
    this.waveSize = Math.max(this.waveSize, leftCount, 1);
    fillRing(ring, 0, 0, r, 5, 0, (leftCount / this.waveSize) * tau, PALETTE.red);
    this.title.setText(run.phase === 'wave' ? `Wave ${run.wave}` : 'Cleared');
    this.hint.setText(run.phase === 'wave' ? 'enemies left' : '');
    this.button.setEnabled(false);
    this.play.setVisible(false);
    this.left.setVisible(true).setText(String(leftCount));
    this.refreshBadge(0);
  }

  /** The "+N" pill on the rim: N gold the press would bank; gone at 0. */
  private refreshBadge(n: number): void {
    if (n <= 0) { this.badgeW = 0; this.badge.setVisible(false); return; }
    this.badgeText.setText(`+${n}`);
    const w = 6 + 12 + 4 + 7 + this.badgeText.width; // pad L, coin, gap, pad R, text
    if (w !== this.badgeW) {
      this.badgeW = w;
      this.badgeCard.setTexture(cardTexture(this.scene, w, BADGE_H, BADGE_H / 2));
      this.badgeCoin.x = -w / 2 + 12;
      this.badgeText.x = -w / 2 + 22;
    }
    this.badge.setVisible(true).setPosition(this.button.container.x + 10, this.button.container.y - 35); // top rim, right of centre
  }

  /** The "+N" pop that rises from the button when a press banks gold (the Send button's pop). */
  private popGold(banked: number): void {
    const b = this.button.container;
    const y = b.y - NEXT_SIZE / 2 - 18;
    const t = this.scene.add.text(b.x, y, `+${banked}`, textStyle(22, PALETTE.goldText, { fontStyle: 'bold', stroke: cssColor(PALETTE.card), strokeThickness: 6 })).setOrigin(0.5);
    this.scene.tweens.add({ targets: t, y: y - 34, alpha: 0, duration: 750, ease: 'Quad.easeOut', onComplete: () => t.destroy() });
  }
}
