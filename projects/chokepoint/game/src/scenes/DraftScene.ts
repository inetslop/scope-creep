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
 * Before the first wave and after every cleared one: the draft's cards (three, four on every
 * fifth; RunFlow.offer); the one picked (click, tap or 1-4) goes into the hand. Each card has two
 * lines: next to the tower glyph what the augment does as a new tower, next to the plus what it
 * adds to a tower. Overlay over a paused GameScene. In ?smoke mode it picks the first card on its
 * own.
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
    const four = game.flow.offer.length === 4;
    const flipped: boolean[] = game.flow.offer.map(() => false);
    let cards: { button: ReturnType<typeof makeButton>; frame: Phaser.GameObjects.Graphics | undefined }[] = [];
    let flipTweens: Phaser.Tweens.Tween[] = [];
    let size = viewSize(this);
    let H = CARD_H; // the offer's card height, set by buildRow
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
    const portrait = (h: number, n: number): { top: number; header: number; gap: number } => {
      let header = 84, gap = 16;
      const col = () => header + n * H + (n - 1) * gap + 16 + 52;
      if (70 + col() > h - 8) { header = 76; gap = 12; }
      const c = col();
      return { top: Math.min(Math.max(70, (h - c) / 2), h - c - 8), header, gap };
    };
    // A four-card draft's card width: portrait puts four in a 2×2 grid (~55% of the card width),
    // landscape shares the three-card row's span across four.
    const cardWidth = (w: number): number => !four ? CARD_W : w < 740 ? 121 : 165;
    const cardSlot = (i: number, w: number, h: number, n: number): { x: number; y: number } => {
      if (four) {
        const cw = cardWidth(w);
        if (w >= 740) return { x: w / 2 + (i - 1.5) * (cw + 16), y: h / 2 + 10 };
        // The 2×2 grid takes the row's area: two rows where the card column was.
        const r = Math.floor(i / 2);
        const top = Math.max(70, (h - 2 * (H + 16) - 90) / 2);
        return { x: w / 2 + (i % 2 === 0 ? -1 : 1) * (cw + 24) / 2, y: top + 84 + H / 2 + r * (H + 16) };
      }
      const p = portrait(h, n);
      return w < 740 ? { x: w / 2, y: p.top + p.header + H / 2 + i * (H + p.gap) } : { x: w / 2 + (i - 1) * (CARD_W + 24), y: h / 2 + 10 };
    };
    const rerollSlot = (w: number, h: number, n: number): { x: number; y: number } => {
      const p = portrait(h, n);
      return w < 740 ? { x: w / 2, y: p.top + p.header + n * H + (n - 1) * p.gap + 16 + 26 } : { x: w / 2, y: h / 2 + 10 + H / 2 + 44 };
    };
    // How many copies of the augment the run holds: in the hand and in every tower's slots.
    const ownedCount = (id: string): number =>
      game.run.hand.filter((c) => c.id === id).length +
      game.towers.towers.reduce((n, t) => n + t.augments.filter((a) => a.id === id).length, 0);
    const buildRow = (copies: AugmentCopy[]): void => {
      for (const t of flipTweens) t.stop();
      flipTweens = [];
      for (const c of cards) { c.button.container.destroy(); c.frame?.destroy(); }
      flipped.fill(false);
      const cw = cardWidth(size.width);
      const k = cw / CARD_W; // the four-card draft's text and marks scale with the narrower card
      const textX = -cw / 2 + 42 * k;
      const wrap = { wordWrap: { width: Math.round(cw - 58 * k) } };
      // Pass 1: lay the two lines out at (0,0) to measure them, then let the card grow to fit.
      const lines = copies.map((copy) => {
        const b = getAugment(copy.id);
        const towerLine = this.add.text(0, 0, tierTowerLine(b, copy.tier), textStyle(four ? 12 : 14, PALETTE.ink, wrap)).setOrigin(0, 0);
        const addedLine = this.add.text(0, 0, tierAddedLine(b, copy.tier), textStyle(four ? 12 : 14, PALETTE.muted, wrap)).setOrigin(0, 0);
        return { copy, b, tier: copy.tier, towerLine, addedLine };
      });
      H = Math.max(CARD_H, ...lines.map((l) => l.towerLine.height + 10 + l.addedLine.height + 117));
      cards = lines.map(({ copy, b, towerLine, addedLine }, i) => {
        const t = -H / 2; // every y below is measured from the card's top edge
        const button = makeButton(this, 0, 0, '', () => pick(i), { width: cw, height: H, radius: Math.round(22 * k), accent: PALETTE[b.look.color] });
        const icon = artScale(this.add.image(0, t + 31, augmentTexture(b.id)), 1.3 * k);
        // Rare and Epic say their tier on the name line; Common keeps the plain name, like its plain frame.
        const nameText = copy.tier === 'common' ? b.name : `${b.name} · ${copy.tier.charAt(0).toUpperCase() + copy.tier.slice(1)}`;
        const name = this.add.text(0, t + 66, nameText, titleStyle(four ? 16 : 20)).setOrigin(0.5);
        // The tier's gems: one light gray, two blue, three purple.
        const gemCount = tierIndex(copy.tier) + 1;
        const gemTint = copy.tier === 'rare' ? PALETTE.blue : copy.tier === 'epic' ? PALETTE.purple : PALETTE.faint;
        const gems: Phaser.GameObjects.Image[] = [];
        for (let g = 0; g < gemCount; g++) gems.push(artScale(this.add.image((g - (gemCount - 1) / 2) * 12, t + 86, GEM_TEXTURE)).setTint(gemTint));
        towerLine.setPosition(textX, t + 101);
        addedLine.setPosition(textX, towerLine.y + towerLine.height + 10);
        const glyphs = this.add.graphics();
        drawTowerGlyph(glyphs, -cw / 2 + 26, towerLine.y + 9);
        drawPlusGlyph(glyphs, -cw / 2 + 26, addedLine.y + 9);
        const key = this.add.text(-cw / 2 + 14, t + 10, String(i + 1), textStyle(12, PALETTE.faint, { fontStyle: 'bold' }));
        button.content.add([icon, name, ...gems, glyphs, towerLine, addedLine, key]);
        const held = ownedCount(copy.id);
        // The run already has this augment: a small dot in the top-right corner.
        if (held > 0) glyphs.fillStyle(PALETTE.muted, 1).fillCircle(cw / 2 - 14, t + 14, 4);
        // The held copies' count, beside the dot; shown only for two or more.
        if (held >= 2) {
          const heldCount = this.add.text(0, 0, `×${held}`, textStyle(12, PALETTE.muted));
          heldCount.setOrigin(1, 0.5);
          heldCount.setPosition(cw / 2 - 14 - 8, t + 14);
          button.content.add(heldCount);
        }
        // The frame draws after the button so it shows on top of its white card.
        const frame = copy.tier === 'common' ? undefined : this.add.graphics();
        if (frame) {
          frame.lineStyle(2, copy.tier === 'rare' ? PALETTE.blue : PALETTE.purple, 1);
          frame.strokeRoundedRect(-cw / 2 - 1, t - 1, cw + 2, H + 2, Math.round(23 * k));
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
          // The fourth card flips in last: ~200 ms after the third one lands.
          delay: i === 3 ? 420 : 100 + i * 60,
          duration: leg,
          ease: 'Quad.easeIn',
          yoyo: true,
          repeat: 1,
          onYoyo: () => { back.setVisible(false); button.content.setVisible(true); frame?.setVisible(true); getSfx(this)?.tierChime(copy.tier); },
          onComplete: () => {
            button.container.setScale(1);
            frame?.setScale(1);
            flipped[i] = true;
            if (copy.tier === 'epic') { const p = cardSlot(i, size.width, size.height, cards.length); epicShimmer(this, p.x, p.y, H, cw); }
          },
        });
        flipTweens.push(flip);
        return { button, frame };
      });
      cards.forEach((c, i) => { const p = cardSlot(i, size.width, size.height, cards.length); c.button.container.setPosition(p.x, p.y); c.frame?.setPosition(p.x, p.y); });
    };
    buildRow(game.flow.offer);

    // The run's one reroll under the cards: pay REROLL_COST and re-roll all of the draft's cards.
    const reroll = (): void => {
      if (this.picked || !game.flow.rerollOffer()) return;
      refreshReroll();
      buildRow(game.flow.offer);
      layout(size.width, size.height); // a reroll can change H
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
      // A four-card draft's portrait is a 2×2 grid, so the header places itself against two rows, not four.
      const p = portrait(height, four && width < 740 ? 2 : cards.length);
      if (width < 740) {
        title.setPosition(width / 2, p.top).setScale(Math.min(1, (width - 32) / (title.width || 1)));
        subtitle.setPosition(width / 2, p.top + 34);
        odds.setPosition(width / 2, p.top + 58);
      } else {
        title.setPosition(width / 2, height / 2 - H / 2 - 74);
        subtitle.setPosition(width / 2, height / 2 - H / 2 - 40);
        odds.setPosition(width / 2, height / 2 - H / 2 - 18);
      }
      cards.forEach((c, i) => {
        const s = cardSlot(i, width, height, cards.length);
        c.button.container.setPosition(s.x, s.y);
        c.frame?.setPosition(s.x, s.y);
      });
      const r = rerollSlot(width, height, cards.length);
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
function epicShimmer(scene: Phaser.Scene, x: number, y: number, h: number, w: number): void {
  const band = scene.add.graphics();
  band.fillStyle(PALETTE.card, 0.05);
  band.fillRect(-36, -h / 2, 24, h);
  band.fillRect(12, -h / 2, 24, h);
  band.fillStyle(PALETTE.card, 0.18);
  band.fillRect(-24, -h / 2, 24, h);
  band.fillRect(0, -h / 2, 24, h);
  band.fillStyle(PALETTE.card, 0.45);
  band.fillRect(-12, -h / 2, 24, h);
  band.setPosition(x - w / 2 + 36, y);
  scene.tweens.add({ targets: band, x: x + w / 2 - 36, duration: 150, ease: 'Linear.easeNone', onComplete: () => band.destroy() });
}
