import Phaser from 'phaser';
import { REROLL_COST } from '../config';
import { artScale, augmentTexture, COIN_TEXTURE, GEM_TEXTURE } from '../art/textures';
import { getAugment } from '../content/augments';
import { cssColor, PALETTE } from '../content/palette';
import type { AugmentCopy } from '../content/types';
import { TIER_ORDER, tierAddedLine, tierIndex, tierOdds, tierTowerLine } from '../core/tiers';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { makeButton } from '../ui/button';
import { textStyle, titleStyle } from '../ui/text';
import { uiCamera, viewSize } from '../ui/display';
import { getGameScene, getSfx, onKey, onResize, SCENES } from './keys';

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
    const flipped: boolean[] = [false, false, false];
    let cards: { button: ReturnType<typeof makeButton>; frame: Phaser.GameObjects.Graphics | undefined }[] = [];
    let flipTweens: Phaser.Tweens.Tween[] = [];
    let size = viewSize(this);
    const pick = (i: number): void => {
      if (this.picked || !flipped[i]) return;
      this.picked = true;
      hook.overlay = '';
      this.scene.stop();
      game.flow.finishDraft(game.flow.offer[i]);
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
    // The odds of this draft's wave, in small gray.
    const oddsLine = tierOdds(game.flow.draftWave);
    const odds = this.add.text(
      0,
      0,
      TIER_ORDER.map((t) => `${t.charAt(0).toUpperCase() + t.slice(1)} ${oddsLine[t]}`).join(' · '),
      textStyle(12, PALETTE.muted),
    ).setOrigin(0.5);
    const cardSlot = (i: number, w: number, h: number) =>
      w < 740 ? { x: w / 2, y: Math.max(70, (h - 3 * (CARD_H + 16) - 90) / 2) + 84 + CARD_H / 2 + i * (CARD_H + 16) }
              : { x: w / 2 + (i - 1) * (CARD_W + 24), y: h / 2 + 10 };
    const rerollSlot = (w: number, h: number) =>
      w < 740 ? { x: w / 2, y: Math.max(70, (h - 3 * (CARD_H + 16) - 90) / 2) + 84 + 3 * CARD_H + 2 * 16 + 42 }
              : { x: w / 2, y: h / 2 + 10 + CARD_H / 2 + 44 };
    const buildRow = (copies: AugmentCopy[]): void => {
      for (const t of flipTweens) t.stop();
      flipTweens = [];
      for (const c of cards) { c.button.container.destroy(); c.frame?.destroy(); }
      flipped.fill(false);
      cards = copies.map((copy, i) => {
        const b = getAugment(copy.id);
        const button = makeButton(this, 0, 0, '', () => pick(i), { width: CARD_W, height: CARD_H, radius: 22, accent: PALETTE[b.look.color] });
        const icon = artScale(this.add.image(0, -72, augmentTexture(b.id)), 1.3);
        // Rare and Epic say their tier on the name line; Common keeps the plain name, like its plain frame.
        const nameText = copy.tier === 'common' ? b.name : `${b.name} · ${copy.tier.charAt(0).toUpperCase() + copy.tier.slice(1)}`;
        const name = this.add.text(0, -37, nameText, titleStyle(20)).setOrigin(0.5);
        // The tier's gems: one light gray, two blue, three purple.
        const gemCount = tierIndex(copy.tier) + 1;
        const gemTint = copy.tier === 'rare' ? PALETTE.blue : copy.tier === 'epic' ? PALETTE.purple : PALETTE.faint;
        const gems: Phaser.GameObjects.Image[] = [];
        for (let g = 0; g < gemCount; g++) gems.push(artScale(this.add.image((g - (gemCount - 1) / 2) * 12, -17, GEM_TEXTURE)).setTint(gemTint));
        const textX = -CARD_W / 2 + 42;
        const wrap = { wordWrap: { width: CARD_W - 58 } };
        const towerLine = this.add.text(textX, -2, tierTowerLine(b, copy.tier), textStyle(14, PALETTE.ink, wrap)).setOrigin(0, 0);
        const addedLine = this.add.text(textX, towerLine.y + towerLine.height + 10, tierAddedLine(b, copy.tier), textStyle(14, PALETTE.muted, wrap)).setOrigin(0, 0);
        const glyphs = this.add.graphics();
        drawTowerGlyph(glyphs, -CARD_W / 2 + 26, towerLine.y + 9);
        drawPlusGlyph(glyphs, -CARD_W / 2 + 26, addedLine.y + 9);
        const key = this.add.text(-CARD_W / 2 + 14, -CARD_H / 2 + 10, String(i + 1), textStyle(12, PALETTE.faint, { fontStyle: 'bold' }));
        button.content.add([icon, name, ...gems, glyphs, towerLine, addedLine, key]);
        // The frame draws after the button so it shows on top of its white card.
        const frame = copy.tier === 'common' ? undefined : this.add.graphics();
        if (frame) {
          frame.lineStyle(2, copy.tier === 'rare' ? PALETTE.blue : PALETTE.purple, 1);
          frame.strokeRoundedRect(-CARD_W / 2 - 1, -CARD_H / 2 - 1, CARD_W + 2, CARD_H + 2, 23);
        }
        // The card's back: one muted-gray gem in the center; hidden when face-up.
        const back = artScale(this.add.image(0, 0, GEM_TEXTURE)).setTint(PALETTE.faint);
        button.content.setVisible(false);
        frame?.setVisible(false);
        button.container.add(back);
        // The flip: the card narrows to a line and widens back face-up; the Epic card's is a bit longer.
        const leg = (copy.tier === 'epic' ? 350 : 200) / 2;
        const flip = this.tweens.add({
          targets: [button.container, ...(frame ? [frame] : [])],
          scaleX: 0.03,
          delay: 100 + i * 60,
          duration: leg,
          ease: 'Quad.easeIn',
          yoyo: true,
          repeat: 1,
          onYoyo: () => { back.setVisible(false); button.content.setVisible(true); frame?.setVisible(true); getSfx(this)?.tierChime(copy.tier); },
          onComplete: () => {
            button.container.setScale(1);
            frame?.setScale(1);
            flipped[i] = true;
            if (copy.tier === 'epic') { const p = cardSlot(i, size.width, size.height); epicShimmer(this, p.x, p.y); }
          },
        });
        flipTweens.push(flip);
        return { button, frame };
      });
      cards.forEach((c, i) => { const p = cardSlot(i, size.width, size.height); c.button.container.setPosition(p.x, p.y); c.frame?.setPosition(p.x, p.y); });
    };
    buildRow(game.flow.offer);

    // The run's one reroll under the cards: pay REROLL_COST and roll three new offers.
    const reroll = (): void => {
      if (this.picked || !game.flow.rerollOffer()) return;
      refreshReroll();
      buildRow(game.flow.offer);
    };
    const rerollButton = makeButton(this, 0, 0, '', reroll, { width: 156, height: 52, fadeWhenDisabled: false });
    const rerollWord = this.add.text(0, 0, 'Reroll ·', textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    const rerollPrice = this.add.text(0, 0, String(REROLL_COST), textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    const rerollCoin = artScale(this.add.image(0, 0, COIN_TEXTURE), 12 / 28); // the HUD "+N coins" glyph
    const rerollHint = this.add.text(-156 / 2 + 12, -52 / 2 + 12, 'R', textStyle(11, PALETTE.faint, { fontStyle: 'bold' }));
    const centerRow = (): void => {
      const w = 12 + 8 + rerollWord.width + 6 + rerollPrice.width;
      rerollCoin.x = -w / 2 + 6; rerollWord.x = -w / 2 + 20; rerollPrice.x = rerollWord.x + rerollWord.width + 6;
    };
    const refreshReroll = (): void => {
      const used = game.run.rerollUsed;
      const afford = game.run.canAfford(REROLL_COST);
      rerollButton.setEnabled(!used && afford);
      rerollPrice.setText(used ? 'used' : String(REROLL_COST));
      rerollWord.setColor(cssColor(used ? PALETTE.muted : PALETTE.ink));
      rerollPrice.setColor(cssColor(used ? PALETTE.muted : afford ? PALETTE.ink : PALETTE.red));
      rerollButton.content.setAlpha(used ? 0.5 : afford ? 1 : 0.6);
      centerRow();
    };
    rerollButton.content.add([rerollCoin, rerollWord, rerollPrice, rerollHint]);
    refreshReroll();
    if (flags.smoke) rerollButton.setEnabled(false);

    const layout = (width: number, height: number): void => {
      size = { width, height };
      shade.setSize(width, height);
      shade.input?.hitArea.setTo(0, 0, width, height);
      const portrait = width < 740;
      if (portrait) {
        const top = Math.max(70, (height - 3 * (CARD_H + 16) - 90) / 2);
        title.setPosition(width / 2, top).setScale(Math.min(1, (width - 32) / (title.width || 1)));
        subtitle.setPosition(width / 2, top + 34);
        odds.setPosition(width / 2, top + 58);
      } else {
        title.setPosition(width / 2, height / 2 - CARD_H / 2 - 74);
        subtitle.setPosition(width / 2, height / 2 - CARD_H / 2 - 40);
        odds.setPosition(width / 2, height / 2 - CARD_H / 2 - 18);
      }
      cards.forEach((c, i) => {
        const p = cardSlot(i, width, height);
        c.button.container.setPosition(p.x, p.y);
        c.frame?.setPosition(p.x, p.y);
      });
      const r = rerollSlot(width, height);
      rerollButton.container.setPosition(r.x, r.y);
    };
    layout(viewSize(this).width, viewSize(this).height);
    onResize(this, layout);
    onKey(this, (e) => {
      if (e.key === 'r' || e.key === 'R') reroll();
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

/**
 * The Epic card's one-shot shimmer: as its flip lands, a flat white band (the card's own color)
 * sweeps the card from its left edge to its right edge in 150 ms. Invisible on the white card,
 * so it reads as the purple frame flashing where the band crosses.
 */
function epicShimmer(scene: Phaser.Scene, x: number, y: number): void {
  const band = scene.add.graphics();
  band.fillStyle(PALETTE.card, 0.05);
  band.fillRect(-36, -CARD_H / 2, 24, CARD_H);
  band.fillRect(12, -CARD_H / 2, 24, CARD_H);
  band.fillStyle(PALETTE.card, 0.18);
  band.fillRect(-24, -CARD_H / 2, 24, CARD_H);
  band.fillRect(0, -CARD_H / 2, 24, CARD_H);
  band.fillStyle(PALETTE.card, 0.45);
  band.fillRect(-12, -CARD_H / 2, 24, CARD_H);
  band.setPosition(x - CARD_W / 2 + 36, y);
  scene.tweens.add({ targets: band, x: x + CARD_W / 2 - 36, duration: 150, ease: 'Linear.easeNone', onComplete: () => band.destroy() });
}
