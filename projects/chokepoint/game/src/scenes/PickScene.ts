import Phaser from 'phaser';
import { BOARD_MARGIN, paintBoardPreview } from '../art/board';
import { CELL, GRID, ROCKS } from '../config';
import { cssColor, PALETTE } from '../content/palette';
import { getLevelAugment, LEVEL_AUGMENTS } from '../content/levels';
import { dailyLevel, dailySeeds, utcDay, type DailyPick } from '../core/daily';
import { generateMap } from '../core/map';
import { levelMultiplierLabel } from '../core/levels';
import { loadProfile } from '../core/profile';
import { pathLineFor } from '../core/path';
import { Rng } from '../core/rng';
import { boardBends, boardChokes, boardFold, boardLengthMul } from '../core/tech';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { makeButton, type Button } from '../ui/button';
import { isNarrow } from '../ui/hud/hud';
import { uiCamera, viewSize } from '../ui/display';
import { textStyle } from '../ui/text';
import { getSfx, onKey, onResize, SCENES } from './keys';

const CARD_PAD = 14; // inside a board card
const CARD_GAP = 28; // between the cards in a row (landscape)
const STACK_GAP = 14; // between the cards when stacked (portrait)
const CHIP_W = 56;
const CHIP_H = 48;
const CHIP_GAP = 6;

/** One board card's measured pieces: the painted map, the column's texts, the height they need. */
interface CardParts {
  key: string;
  texW: number;
  texH: number;
  entries: Phaser.GameObjects.Text[]; // name, line, name, line, ... in the column's order
  mul: Phaser.GameObjects.Text | undefined;
  cardH: number;
}

/**
 * The pick step between the menu and a new run: the day's three boards (core/daily.ts), each as a
 * card with a live preview of the exact board the run will play, the level augments it carries at
 * the chosen level, and the level row to change that. Tapping a card (or 1/2/3) starts the run on
 * it; Back (Esc) returns to the menu.
 */
export class PickScene extends Phaser.Scene {
  private seeds: [number, number, number] = [0, 0, 0];
  private slots = 0;
  private level = 0;
  private bends = 0;
  private lengthMul = 1;
  private chokes = 1;
  private fold = false;
  private portrait = false;
  private closed = false;
  private box: Phaser.GameObjects.Container | undefined;
  private boxW = 1;
  private boxH = 1;

  constructor() {
    super(SCENES.pick);
  }

  create(): void {
    uiCamera(this);
    hook.scene = SCENES.pick;
    hook.overlay = '';
    this.cameras.main.setBackgroundColor(cssColor(PALETTE.ground));
    const p = loadProfile(window.localStorage);
    this.slots = Math.min(p.levelSlots, LEVEL_AUGMENTS.length);
    this.level = this.slots; // the highest, by default
    this.bends = boardBends(p.purchased);
    this.lengthMul = boardLengthMul(p.purchased);
    this.chokes = boardChokes(p.purchased);
    this.fold = boardFold(p.purchased);
    // The day is read when the step opens; the choices change at 00:00 UTC.
    this.seeds = dailySeeds(utcDay(Date.now()));
    this.build();
    onResize(this, (w, h) => {
      if (h > w !== this.portrait) this.build(); // a new orientation is a different board for each seed
      else this.layoutView(w, h);
    });
    onKey(this, (e) => {
      if (e.key === 'Escape') this.back();
      else if (e.key === '1' || e.key === '2' || e.key === '3') this.start(Number(e.key) - 1);
    });
    if (flags.smoke) this.time.delayedCall(1200, () => this.start(0));
    this.events.once('shutdown', () => {
      for (let i = 0; i < this.seeds.length; i++) for (const o of [0, 1]) this.textures.remove(`pick:board:${i}:${o}`);
    });
  }

  /** Rebuilds the whole step: the level row, the three board cards at the chosen level, and the back row. */
  private build(): void {
    const { width, height } = viewSize(this);
    // The same rule as GameScene's new run (height > width), so the preview is the board the run plays.
    this.portrait = height > width;
    const portrait = this.portrait;
    const narrow = isNarrow(width);
    this.box?.destroy();

    const cardW = portrait ? Math.min(380, width - 32) : Math.min(430, Math.max(300, (width - 56) / 3));
    const prevW = portrait ? 132 : cardW - CARD_PAD * 2;
    const prevH = portrait ? 156 : 220;
    const colW = portrait ? cardW - CARD_PAD * 2 - prevW - 12 : cardW - CARD_PAD * 2;

    // The cards' columns first, so the texts (and their wrapping) set each card's height.
    const cards: CardParts[] = this.seeds.map((seed, i) => {
      const map = generateMap(new Rng(seed), portrait ? GRID.short : GRID.long, portrait ? GRID.long : GRID.short, ROCKS, this.bends, this.lengthMul, 2, this.chokes, this.fold);
      const key = `pick:board:${i}:${portrait ? 1 : 0}`;
      paintBoardPreview(this, key, map, pathLineFor(map, CELL));
      const ids = dailyLevel(seed, this.level);
      const entries: Phaser.GameObjects.Text[] = [];
      let y = 0;
      for (const id of ids) {
        const def = getLevelAugment(id);
        if (!def) continue;
        const name = this.add.text(0, 0, def.name, textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0);
        const line = this.add.text(0, 0, def.line, textStyle(12, PALETTE.muted, { wordWrap: { width: colW }, lineSpacing: 2 })).setOrigin(0, 0);
        entries.push(name, line);
        y += name.height + 4 + line.height + 7;
      }
      let mul: Phaser.GameObjects.Text | undefined;
      if (ids.length > 0) {
        mul = this.add.text(0, 0, levelMultiplierLabel(ids), textStyle(16, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0);
        y += mul.height;
      }
      return { key, texW: map.cols * CELL + BOARD_MARGIN * 2, texH: map.rows * CELL + BOARD_MARGIN * 2, entries, mul, cardH: CARD_PAD * 2 + (portrait ? Math.max(prevH, y) : prevH + 10 + y) };
    });
    const cardsW = portrait ? cardW : cardW * 3 + CARD_GAP * 2;
    const cardsH = portrait
      ? cards.reduce((sum, c) => sum + c.cardH, 0) + STACK_GAP * (cards.length - 1)
      : Math.max(...cards.map((c) => c.cardH));

    // The level row: a chip per slot, preselected on the highest — or the muted teaser with none.
    let rowH: number;
    let rowW: number;
    const chips: Button[] = [];
    let teaser: Phaser.GameObjects.Text | undefined;
    if (this.slots > 0) {
      rowH = CHIP_H;
      rowW = (this.slots + 1) * CHIP_W + this.slots * CHIP_GAP;
      for (let i = 0; i <= this.slots; i++) {
        chips.push(makeButton(this, 0, 0, `Level ${i}`, () => this.pickLevel(i), { width: CHIP_W, height: CHIP_H, fontSize: 13, radius: 14, fill: i === this.level ? PALETTE.ink : PALETTE.card }));
      }
    } else {
      teaser = this.add.text(0, 0, 'reach wave 30 to unlock level 1', textStyle(14, PALETTE.muted)).setOrigin(0.5);
      rowH = teaser.height;
      rowW = teaser.width;
    }
    // The next goal, while the ladder still has a step left.
    let goal: Phaser.GameObjects.Text | undefined;
    if (this.slots > 0 && this.slots < LEVEL_AUGMENTS.length) {
      goal = this.add.text(0, 0, `wave 30 at level ${this.slots} unlocks level ${this.slots + 1}`, textStyle(13, PALETTE.muted)).setOrigin(0.5);
    }
    const esc = this.add.text(0, 0, 'Esc', textStyle(11, PALETTE.faint, { fontStyle: 'bold' })).setOrigin(0.5);
    if (narrow) esc.setVisible(false);
    const back = makeButton(this, 0, 0, 'Back', () => this.back(), { width: 160, height: 52, radius: 26 });
    const backRowW = 160 + (narrow ? 0 : 12 + esc.width);

    // Top-down, the gaps between the sections count too.
    let boxH = rowH;
    if (goal) boxH += 12 + goal.height;
    boxH += 16 + cardsH + 20 + 52;
    const boxW = Math.max(rowW, cardsW, backRowW, goal ? goal.width : 0);
    let y = -boxH / 2;

    const kids: Phaser.GameObjects.GameObject[] = [];
    if (teaser) {
      teaser.setY(y + rowH / 2);
      y += rowH;
      kids.push(teaser);
    } else {
      const rowY = y + CHIP_H / 2;
      chips.forEach((chip, i) => {
        chip.container.setPosition(-rowW / 2 + CHIP_W / 2 + i * (CHIP_W + CHIP_GAP), rowY);
        kids.push(chip.container);
      });
      y += rowH;
    }
    if (goal) {
      y += 12;
      goal.setY(y + goal.height / 2);
      y += goal.height;
      kids.push(goal);
    }
    y += 16;
    const cardsTop = y;
    let stackY = 0;
    cards.forEach((c, i) => {
      const cx = portrait ? 0 : -cardsW / 2 + cardW / 2 + i * (cardW + CARD_GAP);
      const cy = portrait ? cardsTop + stackY + c.cardH / 2 : cardsTop + cardsH / 2;
      stackY += c.cardH + STACK_GAP;
      const card = makeButton(this, cx, cy, '', () => this.start(i), { width: cardW, height: c.cardH, radius: 20 });
      card.label.setVisible(false);
      kids.push(card.container);
      // The preview: painted at 1 px, so it is scaled to its box directly (never artScale).
      const img = this.add.image(0, 0, c.key);
      img.setScale(Math.min(prevW / c.texW, prevH / c.texH));
      img.setPosition(cx - (portrait ? cardW / 2 - CARD_PAD - prevW / 2 : 0), cy - c.cardH / 2 + CARD_PAD + prevH / 2);
      kids.push(img);
      // The column: name over line per augment, the multiplier under them.
      const colX = cx - cardW / 2 + CARD_PAD + (portrait ? prevW + 12 : 0);
      const colTop = cy - c.cardH / 2 + CARD_PAD + (portrait ? 0 : prevH + 10);
      let ey = 0;
      for (let k = 0; k + 1 < c.entries.length; k += 2) {
        const name = c.entries[k]!;
        const line = c.entries[k + 1]!;
        name.setPosition(colX, colTop + ey);
        line.setPosition(colX, colTop + ey + name.height + 4);
        ey += name.height + 4 + line.height + 7;
        kids.push(name, line);
      }
      if (c.mul) {
        c.mul.setPosition(colX, colTop + ey);
        kids.push(c.mul);
      }
      // The card's key, in its top-right corner (a touch screen taps the card instead).
      const keyHint = this.add.text(0, 0, String(i + 1), textStyle(11, PALETTE.faint, { fontStyle: 'bold' })).setOrigin(1, 0);
      if (narrow) keyHint.setVisible(false);
      keyHint.setPosition(cx + cardW / 2 - 12, cy - c.cardH / 2 + 10);
      kids.push(keyHint);
    });
    y += cardsH + 20;
    back.container.setPosition(-backRowW / 2 + 80, y + 26);
    esc.setPosition(backRowW / 2 - esc.width / 2, y + 26);
    kids.push(back.container, esc);

    this.box = this.add.container(0, 0, kids);
    this.boxW = boxW;
    this.boxH = boxH;
    this.layoutView(width, height);
  }

  /** Centered and shrunk to fit, never grown. */
  private layoutView(width: number, height: number): void {
    this.box?.setPosition(width / 2, height / 2).setScale(Math.min(1, (width - 16) / this.boxW, (height - 16) / this.boxH));
  }

  /** A chip tap: the chosen level lives in a field, and the rebuild waits for the tap to finish. */
  private pickLevel(i: number): void {
    if (this.closed || i < 0 || i > this.slots) return;
    this.level = i;
    getSfx(this)?.blip();
    this.time.delayedCall(50, () => this.build());
  }

  /** Starts the run on card i: that board's seed, and its level augments at the chosen level. */
  start(i: number): void {
    if (this.closed || i < 0 || i >= this.seeds.length) return;
    this.closed = true;
    const pick: DailyPick = { seed: this.seeds[i]!, level: dailyLevel(this.seeds[i]!, this.level) };
    this.registry.set('dailyPick', pick);
    this.scene.start(SCENES.game);
  }

  /** Back to the menu: nothing of the cancelled run may wait for a later one — an Iron run bailed
   * out here must not make a Ghost or "again" run start in Iron. */
  back(): void {
    if (this.closed) return;
    this.closed = true;
    this.registry.remove('dailyPick');
    this.registry.remove('ironMode');
    this.scene.start(SCENES.menu);
  }
}
