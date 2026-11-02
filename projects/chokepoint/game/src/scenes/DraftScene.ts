import Phaser from 'phaser';
import { DraftBed } from '../audio/draftBed';
import { rerollCost } from '../config';
import { artScale, augmentTexture, COIN_TEXTURE, GEM_TEXTURE } from '../art/textures';
import { getAugment } from '../content/augments';
import { cssColor, PALETTE } from '../content/palette';
import type { AugmentCopy } from '../content/types';
import { TIER_ORDER, tierAddedLine, tierIndex, tierOdds, tierTowerLine } from '../core/tiers';
import { loadProfile } from '../core/profile';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { makeButton } from '../ui/button';
import { makeCard } from '../ui/card';
import { textStyle, titleStyle } from '../ui/text';
import { tierGemColor, tierName } from '../ui/tierLook';
import { uiCamera, viewSize } from '../ui/display';
import { buildFitRow } from './draftFitRow';
import { getGameScene, getSfx, onKey, onResize, SCENES } from './keys';

const CARD_W = 220;
const CARD_H = 206;
const HINT_W = 140;
const HINT_H = 44;
const HINT_GAP = 12;

/**
 * Before the first wave and after every cleared one: the draft's cards (three, four on every
 * fifth; RunFlow.offer); the one picked (click, tap or 1-4) goes into the hand. Each card has two
 * lines: next to the tower glyph what the augment does as a new tower, next to the plus what it
 * adds to a tower. The four-card draft's 4th card is the Wildcard: a plain white card, a "?" in
 * its place, hidden until the pick flips it to the augment it rolled. Overlay over a paused
 * GameScene. In ?smoke mode it picks the first card on its own.
 */
export class DraftScene extends Phaser.Scene {
  private picked = false;
  bed!: DraftBed; // the draft's quiet bed: its shutdown stops it, runChecks reads it while the draft is open

  constructor() {
    super(SCENES.draft);
  }

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 0.05);
    this.bed.update(dt, !this.scene.isActive(SCENES.pause)); // silent under the pause screen, like the other beds
  }

  create(): void {
    uiCamera(this);
    hook.overlay = SCENES.draft;
    this.bed = new DraftBed(getSfx(this));
    this.events.once('shutdown', () => this.bed.stop()); // the pick's fade-out and ringing notes must not outlive the draft (the Sfx context is the singleton's)
    this.picked = false;
    const game = getGameScene(this);
    const four = game.flow.offer.length === 4;
    const flipped: boolean[] = game.flow.offer.map(() => false);
    let cards: { button: ReturnType<typeof makeButton>; frame: Phaser.GameObjects.Graphics | undefined; hidden?: (Phaser.GameObjects.Text | Phaser.GameObjects.Image)[]; resolved?: (Phaser.GameObjects.Text | Phaser.GameObjects.Image)[] }[] = [];
    let flipTweens: Phaser.Tweens.Tween[] = [];
    let size = viewSize(this);
    let H = CARD_H; // the offer's card height, set by buildRow
    const pick = (i: number): void => {
      if (this.picked || !flipped[i]) return;
      this.picked = true;
      hook.overlay = '';
      const copy = game.flow.offer[i];
      const close = (): void => {
        if (hint) {
          this.tweens.add({ targets: hint, alpha: 0, duration: 150, ease: 'Quad.easeIn' });
          this.time.delayedCall(150, () => this.scene.stop());
        } else {
          this.scene.stop();
        }
        game.flow.finishDraft(copy);
      };
      // The Wildcard flips to the augment it rolled (its own tier chime with it); the build phase opens only after.
      const hidden = cards[i]?.hidden;
      const resolved = cards[i]?.resolved;
      if (hidden && resolved) {
        this.tweens.add({
          targets: cards[i]!.button.container,
          scaleX: 0.03,
          duration: 150,
          ease: 'Quad.easeIn',
          yoyo: true,
          repeat: 1,
          onYoyo: () => {
            hidden.forEach((o) => o.setVisible(false));
            resolved.forEach((o) => o.setVisible(true));
            getSfx(this)?.tierChime(copy.tier);
          },
          onComplete: close,
        });
      } else {
        close();
      }
    };

    // Veils the board and swallows clicks, so nothing underneath reacts.
    const shade = this.add.rectangle(0, 0, 10, 10, PALETTE.ground, 0.78).setOrigin(0).setInteractive();
    const opening = game.run.wave === 0;
    const showHint = opening && loadProfile(window.localStorage).runsPlayed === 0;
    // The fit row: at least one run tower with a free slot — the draft's version of the ghost.
    const hasRow = game.towers.towers.some((t) => t.freeSlots > 0);
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
    const hint = showHint
      ? this.add.container(0, 0, [
          makeCard(this, 0, 0, HINT_W, HINT_H, 14),
          this.add.text(0, 0, 'Pick a card', textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5),
        ])
      : undefined;
    const portrait = (h: number, n: number): { top: number; header: number; gap: number } => {
      let header = 84, gap = 16;
      if (showHint) header += HINT_H + HINT_GAP * 2 - 26; // the hint card takes the odds-to-cards gap
      const col = () => header + n * H + (n - 1) * gap + 16 + 52;
      if (70 + col() > h - 8) { header = 76 + (showHint ? HINT_H + HINT_GAP * 2 - 18 : 0); gap = 12; }
      const c = col();
      return { top: Math.min(Math.max(70, (h - c) / 2), h - c - 8), header, gap };
    };
    // A four-card draft's card width: portrait puts four in a 2×2 grid (~55% of the card width),
    // landscape shares the three-card row's span across four.
    const cardWidth = (w: number): number => w >= 740 ? (four ? 165 : CARD_W) : four ? 121 : hasRow ? 178 : CARD_W;
    const cardSlot = (i: number, w: number, h: number, n: number): { x: number; y: number } => {
      if (four || (w < 740 && hasRow)) {
        const cw = cardWidth(w);
        if (four && w >= 740) return { x: w / 2 + (i - 1.5) * (cw + 16), y: h / 2 + 10 };
        // The grid takes the row's area: two rows where the card column was.
        const r = Math.floor(i / 2);
        const top = Math.max(70, (h - 2 * (H + 16) - 90) / 2);
        const x = i === 2 && !four ? w / 2 : w / 2 + (i % 2 === 0 ? -1 : 1) * (cw + (four ? 24 : 16)) / 2;
        return { x, y: top + 84 + H / 2 + r * (H + 16) };
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
      // The four-card draft keeps its icons at full size, so the text starts 6 px right of the
      // icon's right edge (centre -cw/2 + 26, half-width 8 → right edge -cw/2 + 34), and the wrap
      // narrows by the same amount to keep the 16k right margin; the three-card keeps its marks scaled.
      const textX = four ? -cw / 2 + 40 : -cw / 2 + 42 * k;
      const wrap = { wordWrap: { width: Math.round(four ? cw - 40 - 16 * k : cw - 58 * k) } };
      // Pass 1: lay the two lines out at (0,0) to measure them, then let the card grow to fit.
      const lines = copies.map((copy) => {
        const b = getAugment(copy.id);
        if (copy.wildcard) return { copy, b, wildcard: true as const, towerLine: undefined, addedLine: undefined, fit: undefined }; // the Wildcard's card has no lines to lay out
        const towerLine = this.add.text(0, 0, tierTowerLine(b, copy.tier), textStyle(four ? 12 : 14, PALETTE.ink, wrap)).setOrigin(0, 0);
        const addedLine = this.add.text(0, 0, tierAddedLine(b, copy.tier), textStyle(four ? 12 : 14, PALETTE.muted, wrap)).setOrigin(0, 0);
        return { copy, b, wildcard: false as const, tier: copy.tier, towerLine, addedLine, fit: buildFitRow(this, k, copy, game.towers.towers) };
      });
      H = Math.max(CARD_H, ...lines.map((l) => (l.towerLine && l.addedLine ? l.towerLine.height + 10 + l.addedLine.height + 117 + (l.fit ? 10 + l.fit.height : 0) : 0)));
      cards = lines.map(({ copy, b, wildcard, towerLine, addedLine, fit }, i) => {
        const t = -H / 2; // every y below is measured from the card's top edge
        if (wildcard) {
          // The Wildcard's face: plain white, the milestone-yellow "?" where the icon would be, its name and one line.
          const button = makeButton(this, 0, 0, '', () => pick(i), { width: cw, height: H, radius: Math.round(22 * k), accent: PALETTE.yellow });
          const question = this.add.text(0, t + 31, '?', titleStyle(24, PALETTE.yellow)).setOrigin(0.5);
          const wName = this.add.text(0, t + 66, 'Wildcard', titleStyle(four ? 16 : 20)).setOrigin(0.5);
          const wLine = this.add.text(0, t + 101, 'becomes a Rare or Epic augment', textStyle(four ? 12 : 14, PALETTE.muted, { align: 'center', wordWrap: { width: cw - 24 } })).setOrigin(0.5, 0);
          const key = this.add.text(-cw / 2 + 14, t + 10, String(i + 1), textStyle(12, PALETTE.faint, { fontStyle: 'bold' }));
          // Its resolved identity, built now and hidden until the pick: the augment's icon, name and tier word.
          const icon = artScale(this.add.image(0, t + 31, augmentTexture(b.id)), 1.3 * k);
          const name = this.add.text(0, 0, b.name, titleStyle(four ? 16 : 20)).setOrigin(0.5);
          const tierWord = this.add.text(0, 0, ` · ${tierName(copy.tier)}`, titleStyle(four ? 16 : 20, tierGemColor(copy.tier))).setOrigin(0.5);
          name.setPosition(-tierWord.width / 2, t + 66);
          tierWord.setPosition(name.width / 2, t + 66);
          const hidden = [question, wName, wLine, key];
          const resolved = [icon, name, tierWord];
          for (const o of resolved) o.setVisible(false);
          button.content.add([...hidden, ...resolved]);
          // The offer flip, quiet: no tier chime, no epic lengthening (the tier is hidden until the pick).
          const back = artScale(this.add.image(0, 0, GEM_TEXTURE)).setTint(PALETTE.faint);
          button.content.setVisible(false);
          button.container.add(back);
          const flip = this.tweens.add({
            targets: [button.container],
            scaleX: 0.03,
            delay: i === 3 ? 420 : 100 + i * 60,
            duration: 100,
            ease: 'Quad.easeIn',
            yoyo: true,
            repeat: 1,
            onYoyo: () => { back.setVisible(false); button.content.setVisible(true); },
            onComplete: () => { button.container.setScale(1); flipped[i] = true; },
          });
          flipTweens.push(flip);
          return { button, frame: undefined, hidden, resolved };
        }
        const button = makeButton(this, 0, 0, '', () => pick(i), { width: cw, height: H, radius: Math.round(22 * k), accent: PALETTE[b.look.color] });
        const icon = artScale(this.add.image(0, t + 31, augmentTexture(b.id)), 1.3 * k);
        // Rare and Epic say their tier on the name line in the tier's color; Common keeps the plain name, like its plain frame.
        const name = this.add.text(0, 0, b.name, titleStyle(four ? 16 : 20)).setOrigin(0.5);
        const tierWord = copy.tier === 'common'
          ? undefined
          : this.add.text(0, 0, ` · ${tierName(copy.tier)}`, titleStyle(four ? 16 : 20, tierGemColor(copy.tier))).setOrigin(0.5);
        if (tierWord) {
          // The pair spans exactly today's one centered text: name the left part, word the right part.
          name.setPosition(-tierWord.width / 2, t + 66);
          tierWord.setPosition(name.width / 2, t + 66);
        } else {
          name.setPosition(0, t + 66);
        }
        // The tier's gems: one light gray, two blue, three purple.
        const gemCount = tierIndex(copy.tier) + 1;
        const gemTint = copy.tier === 'rare' ? PALETTE.blue : copy.tier === 'epic' ? PALETTE.purple : PALETTE.faint;
        const gems: Phaser.GameObjects.Image[] = [];
        for (let g = 0; g < gemCount; g++) gems.push(artScale(this.add.image((g - (gemCount - 1) / 2) * 12, t + 86, GEM_TEXTURE)).setTint(gemTint));
        towerLine.setPosition(textX, t + 101);
        addedLine.setPosition(textX, towerLine.y + towerLine.height + 10);
        if (fit) fit.container.setPosition(0, addedLine.y + addedLine.height + 10 + fit.height / 2);
        const glyphs = this.add.graphics();
        drawTowerGlyph(glyphs, -cw / 2 + 26, towerLine.y + 9);
        drawPlusGlyph(glyphs, -cw / 2 + 26, addedLine.y + 9);
        const key = this.add.text(-cw / 2 + 14, t + 10, String(i + 1), textStyle(12, PALETTE.faint, { fontStyle: 'bold' }));
        button.content.add([icon, name, ...(tierWord ? [tierWord] : []), ...gems, glyphs, towerLine, addedLine, key, ...(fit ? [fit.container] : [])]);
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

    // The reroll under the cards: pay for the run's next one (it gets dearer each time) and re-roll all of the draft's cards.
    const reroll = (): void => {
      if (this.picked || !game.flow.rerollOffer()) return;
      refreshReroll();
      buildRow(game.flow.offer);
      layout(size.width, size.height); // a reroll can change H
    };
    const rerollButton = makeButton(this, 0, 0, '', reroll, { width: 156, height: 52, fadeWhenDisabled: false });
    const rerollWord = this.add.text(0, 0, 'Reroll ·', textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    const rerollPrice = this.add.text(0, 0, String(rerollCost(game.run.rerollsUsed)), textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    const rerollCoin = artScale(this.add.image(0, 0, COIN_TEXTURE), 12 / 28); // the HUD "+N coins" glyph
    const rerollHint = this.add.text(-156 / 2 + 12, -52 / 2 + 12, 'R', textStyle(11, PALETTE.faint, { fontStyle: 'bold' }));
    const centerRow = (): void => {
      const w = 12 + 8 + rerollWord.width + 6 + rerollPrice.width;
      rerollCoin.x = -w / 2 + 6; rerollWord.x = -w / 2 + 20; rerollPrice.x = rerollWord.x + rerollWord.width + 6;
    };
    const refreshReroll = (): void => {
      const cost = rerollCost(game.run.rerollsUsed);
      const afford = game.run.canAfford(cost);
      rerollButton.setEnabled(afford);
      rerollPrice.setText(String(cost));
      rerollWord.setColor(cssColor(PALETTE.ink));
      rerollPrice.setColor(cssColor(afford ? PALETTE.ink : PALETTE.red));
      rerollButton.content.setAlpha(afford ? 1 : 0.6);
      centerRow();
    };
    rerollButton.content.add([rerollCoin, rerollWord, rerollPrice, rerollHint]);
    refreshReroll();
    if (flags.smoke) rerollButton.setEnabled(false);

    const layout = (width: number, height: number): void => {
      size = { width, height };
      shade.setSize(width, height);
      shade.input?.hitArea.setTo(0, 0, width, height);
      // A portrait grid draft (four cards, or three with a fit row) places the header against two rows, not n.
      const rows = width < 740 && (four || hasRow) ? 2 : cards.length;
      const p = portrait(height, rows);
      if (width < 740) {
        title.setPosition(width / 2, p.top).setScale(Math.min(1, (width - 32) / (title.width || 1)));
        subtitle.setPosition(width / 2, p.top + 34);
        odds.setPosition(width / 2, p.top + 58);
      } else {
        const shift = showHint ? HINT_H + HINT_GAP * 2 : 0;
        title.setPosition(width / 2, height / 2 - H / 2 - 74 - shift);
        subtitle.setPosition(width / 2, height / 2 - H / 2 - 40 - shift);
        odds.setPosition(width / 2, height / 2 - H / 2 - 18 - shift);
      }
      cards.forEach((c, i) => {
        const s = cardSlot(i, width, height, cards.length);
        c.button.container.setPosition(s.x, s.y);
        c.frame?.setPosition(s.x, s.y);
      });
      const r = rerollSlot(width, height, rows);
      rerollButton.container.setPosition(r.x, r.y);
      if (hint) {
        const first = cardSlot(0, width, height, cards.length);
        hint.setPosition(width / 2, (odds.y + 6 + first.y - H / 2) / 2);
      }
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
