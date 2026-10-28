import Phaser from 'phaser';
import { getAugment } from '../content/augments';
import { PALETTE } from '../content/palette';
import { artScale, augmentTexture } from '../art/textures';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { makeButton } from '../ui/button';
import { textStyle, titleStyle } from '../ui/text';
import { uiCamera, viewSize } from '../ui/display';
import { getGameScene, onKey, onResize, SCENES } from './keys';

const CARD_W = 220;
const CARD_H = 206;

/**
 * Before the first wave and after every cleared one: three augment cards (RunFlow.offer); the
 * one picked (click, tap or 1-3) goes into the hand. Each card has two lines: next to the tower
 * glyph what the augment does as a new tower, next to the plus what it adds to a tower. Overlay
 * over a paused GameScene. In ?smoke mode it picks the first card on its own.
 */
export class DraftScene extends Phaser.Scene {
  private picked = false;

  constructor() {
    super(SCENES.draft);
  }

  create(): void {
    uiCamera(this);
    hook.overlay = SCENES.draft;
    this.picked = false;
    const game = getGameScene(this);
    const offered = game.flow.offer.map(getAugment);
    const pick = (i: number): void => {
      if (this.picked || !offered[i]) return;
      this.picked = true;
      hook.overlay = '';
      this.scene.stop();
      game.flow.finishDraft(offered[i].id);
    };

    // Veils the board and swallows clicks, so nothing underneath reacts.
    const shade = this.add.rectangle(0, 0, 10, 10, PALETTE.ground, 0.78).setOrigin(0).setInteractive();
    const opening = game.run.wave === 0;
    const title = this.add.text(0, 0, opening ? 'Choose your first augment' : `Wave ${game.run.wave} cleared`, titleStyle(30)).setOrigin(0.5);
    // The legend for the two glyphs on the cards.
    const legendText = (x: number, text: string): Phaser.GameObjects.Text => this.add.text(x, 0, text, textStyle(15, PALETTE.muted)).setOrigin(0, 0.5);
    const legendGlyphs = this.add.graphics();
    drawTowerGlyph(legendGlyphs, -150, 0);
    drawPlusGlyph(legendGlyphs, 18, 0);
    const subtitle = this.add.container(0, 0, [legendGlyphs, legendText(-136, 'as a new tower'), legendText(32, 'added to a tower')]);
    const cards = offered.map((b, i) => {
      const button = makeButton(this, 0, 0, '', () => pick(i), { width: CARD_W, height: CARD_H, radius: 22, accent: PALETTE[b.look.color] });
      const icon = artScale(this.add.image(0, -64, augmentTexture(b.id)), 1.3);
      const name = this.add.text(0, -26, b.name, titleStyle(20)).setOrigin(0.5);
      const textX = -CARD_W / 2 + 42;
      const wrap = { wordWrap: { width: CARD_W - 58 } };
      const towerLine = this.add.text(textX, -6, b.asTower, textStyle(14, PALETTE.ink, wrap)).setOrigin(0, 0);
      const addedLine = this.add.text(textX, towerLine.y + towerLine.height + 10, b.asAdded, textStyle(14, PALETTE.muted, wrap)).setOrigin(0, 0);
      const glyphs = this.add.graphics();
      drawTowerGlyph(glyphs, -CARD_W / 2 + 26, towerLine.y + 9);
      drawPlusGlyph(glyphs, -CARD_W / 2 + 26, addedLine.y + 9);
      const key = this.add.text(-CARD_W / 2 + 14, -CARD_H / 2 + 10, String(i + 1), textStyle(12, PALETTE.faint, { fontStyle: 'bold' }));
      button.content.add([icon, name, glyphs, towerLine, addedLine, key]);
      return button;
    });

    const layout = (width: number, height: number): void => {
      shade.setSize(width, height);
      shade.input?.hitArea.setTo(0, 0, width, height);
      const portrait = width < 740;
      if (portrait) {
        const top = Math.max(70, (height - 3 * (CARD_H + 16) - 90) / 2);
        title.setPosition(width / 2, top).setScale(Math.min(1, (width - 32) / (title.width || 1)));
        subtitle.setPosition(width / 2, top + 34);
        cards.forEach((c, i) => c.container.setPosition(width / 2, top + 84 + CARD_H / 2 + i * (CARD_H + 16)));
      } else {
        title.setPosition(width / 2, height / 2 - CARD_H / 2 - 74);
        subtitle.setPosition(width / 2, height / 2 - CARD_H / 2 - 40);
        cards.forEach((c, i) => c.container.setPosition(width / 2 + (i - (cards.length - 1) / 2) * (CARD_W + 24), height / 2 + 10));
      }
    };
    layout(viewSize(this).width, viewSize(this).height);
    onResize(this, layout);
    onKey(this, (e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= cards.length) pick(n - 1);
    });
    if (flags.smoke) this.time.delayedCall(800, () => pick(0));
  }
}

/** "As a new tower": a small plinth with a dot. */
function drawTowerGlyph(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  g.fillStyle(PALETTE.cardDeep, 1);
  g.fillRoundedRect(x - 8, y - 6, 16, 15, 4);
  g.fillStyle(PALETTE.faint, 1);
  g.fillRoundedRect(x - 8, y - 8, 16, 14, 4);
  g.fillStyle(PALETTE.ink, 1);
  g.fillCircle(x, y - 1, 3.5);
}

/** "Added to a tower": a plus. */
function drawPlusGlyph(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  g.fillStyle(PALETTE.ink, 0.7);
  g.fillRoundedRect(x - 7, y - 1.75, 14, 3.5, 1.75);
  g.fillRoundedRect(x - 1.75, y - 7, 3.5, 14, 1.75);
}
