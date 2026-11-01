import Phaser from 'phaser';
import { BOARD_MARGIN, paintBoardPreview } from '../art/board';
import { CELL, GRID, ROCKS } from '../config';
import { cssColor, PALETTE } from '../content/palette';
import { getLevelAugment, LEVEL_AUGMENTS } from '../content/levels';
import { dailyLevel, dailySeeds, utcDay, type DailyPick } from '../core/daily';
import { generateMap, type GameMap } from '../core/map';
import { levelMultiplierLabel } from '../core/levels';
import { loadProfile } from '../core/profile';
import { pathLineFor } from '../core/path';
import { Rng } from '../core/rng';
import { roadBends } from '../core/roadBends';
import { boardBends, boardChokes, boardFold, boardLengthMul } from '../core/tech';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { makeButton, type Button } from '../ui/button';
import { makeCard } from '../ui/card';
import { isNarrow } from '../ui/hud/hud';
import { uiCamera, viewSize } from '../ui/display';
import { textStyle } from '../ui/text';
import { getSfx, onKey, onResize, SCENES } from './keys';

const CARD_PAD = 14; // inside a board card
const CARD_GAP = 28; // between the cards in a row (landscape)
const CHIP = 44; // a round level chip
const CHIP_GAP = 8;
const THUMB_W = 60; // a thumbnail's preview box (portrait)
const THUMB_H = 100;
const THUMB_GAP = 14;
const DETAIL_W = 150; // the detail card's preview box (portrait)
const DETAIL_H = 252;
const PLAY_W = 260;
const PLAY_H = 56;

/** One board card's measured pieces: the painted map, the column's texts, the height they need. */
interface CardParts {
  key: string;
  texW: number;
  texH: number;
  entries: Phaser.GameObjects.Text[]; // name, line, name, line, ... in the column's order
  mul: Phaser.GameObjects.Text | undefined;
  cardH: number;
}

/** One section of the step: its objects in a container whose top edge is y 0, centered on x 0. */
interface Part {
  obj: Phaser.GameObjects.Container;
  w: number;
  h: number;
}

/**
 * The pick step between the menu and a new run: the day's three boards (core/daily.ts), each a
 * live preview of the exact board the run will play, the level augments it carries at the chosen
 * level, and the level row to change that. Landscape shows the three as cards in a row: tapping
 * a card (or 1/2/3) starts the run on it. Portrait shows them as thumbnails over one detail card
 * for the selected board: a thumbnail (or 1/2/3) selects, Play (Enter) starts. Back (Esc)
 * returns to the menu.
 */
export class PickScene extends Phaser.Scene {
  private seeds: [number, number, number] = [0, 0, 0];
  private slots = 0;
  private level = 0;
  private sel = 0;
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
    this.sel = 0;
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
      else if (e.key === '1' || e.key === '2' || e.key === '3') {
        if (this.portrait) this.pickBoard(Number(e.key) - 1);
        else this.start(Number(e.key) - 1);
      } else if ((e.key === 'Enter' || e.key === ' ') && this.portrait) this.start(this.sel);
    });
    if (flags.smoke) this.time.delayedCall(1200, () => this.start(0));
    this.events.once('shutdown', () => {
      for (let i = 0; i < this.seeds.length; i++) for (const o of [0, 1]) this.textures.remove(`pick:board:${i}:${o}`);
    });
  }

  /** Rebuilds the whole step: the level row, the boards at the chosen level, and the back row. */
  private build(): void {
    const { width, height } = viewSize(this);
    // The same rule as GameScene's new run (height > width), so the preview is the board the run plays.
    this.portrait = height > width;
    const portrait = this.portrait;
    this.box?.destroy();

    const maps = this.seeds.map((seed, i) => {
      const map = generateMap(new Rng(seed), portrait ? GRID.short : GRID.long, portrait ? GRID.long : GRID.short, ROCKS, this.bends, this.lengthMul, 2, this.chokes, this.fold);
      paintBoardPreview(this, this.boardKey(i), map, pathLineFor(map, CELL));
      return map;
    });
    const head = this.buildHead();
    const body = portrait ? this.buildDetail(width, maps) : this.buildRow(width, maps);
    const foot = this.buildBack(isNarrow(width));

    const parts: [Part, number][] = [[head, 16], [body, 20], [foot, 0]];
    const boxH = parts.reduce((sum, [p, gap]) => sum + p.h + gap, 0);
    const boxW = Math.max(...parts.map(([p]) => p.w));
    let y = -boxH / 2;
    for (const [p, gap] of parts) {
      p.obj.setY(y);
      y += p.h + gap;
    }
    this.box = this.add.container(0, 0, parts.map(([p]) => p.obj));
    this.boxW = boxW;
    this.boxH = boxH;
    this.layoutView(width, height);
  }

  private boardKey(i: number): string {
    return `pick:board:${i}:${this.portrait ? 1 : 0}`;
  }

  /** The painted preview of board i, scaled to fit a box (painted at 1 px: never artScale). */
  private preview(i: number, map: GameMap, boxW: number, boxH: number): Phaser.GameObjects.Image {
    const texW = map.cols * CELL + BOARD_MARGIN * 2;
    const texH = map.rows * CELL + BOARD_MARGIN * 2;
    return this.add.image(0, 0, this.boardKey(i)).setScale(Math.min(boxW / texW, boxH / texH));
  }

  /** The level row — "Level" and a round chip per level, the chosen one ink — or the muted
   * teaser with no slots; and the next goal under it while the ladder has a step left. */
  private buildHead(): Part {
    const kids: Phaser.GameObjects.GameObject[] = [];
    let h: number;
    let w: number;
    if (this.slots > 0) {
      const word = this.add.text(0, CHIP / 2, 'Level', textStyle(16, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
      w = word.width + 12 + (this.slots + 1) * CHIP + this.slots * CHIP_GAP;
      word.setX(-w / 2);
      kids.push(word);
      for (let i = 0; i <= this.slots; i++) {
        const x = -w / 2 + word.width + 12 + CHIP / 2 + i * (CHIP + CHIP_GAP);
        const chip = makeButton(this, x, CHIP / 2, String(i), () => this.pickLevel(i), { width: CHIP, height: CHIP, fontSize: 18, radius: CHIP / 2, fill: i === this.level ? PALETTE.ink : PALETTE.card });
        kids.push(chip.container);
      }
      h = CHIP;
    } else {
      const teaser = this.add.text(0, 0, 'reach wave 30 to unlock level 1', textStyle(14, PALETTE.muted)).setOrigin(0.5, 0);
      kids.push(teaser);
      h = teaser.height;
      w = teaser.width;
    }
    if (this.slots > 0 && this.slots < LEVEL_AUGMENTS.length) {
      const goal = this.add.text(0, h + 12, `wave 30 at level ${this.slots} unlocks level ${this.slots + 1}`, textStyle(13, PALETTE.muted)).setOrigin(0.5, 0);
      kids.push(goal);
      h += 12 + goal.height;
      w = Math.max(w, goal.width);
    }
    return { obj: this.add.container(0, 0, kids), w, h };
  }

  /** Landscape: the three boards as cards in a row, each a tap (or its key) that starts the run on it. */
  private buildRow(width: number, maps: GameMap[]): Part {
    const narrow = isNarrow(width);
    const cardW = Math.min(430, Math.max(300, (width - 56) / 3));
    const prevW = cardW - CARD_PAD * 2;
    const prevH = 220;
    const colW = cardW - CARD_PAD * 2;

    // The cards' columns first, so the texts (and their wrapping) set each card's height.
    const cards: CardParts[] = this.seeds.map((seed, i) => {
      const map = maps[i]!;
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
      return { key: this.boardKey(i), texW: map.cols * CELL + BOARD_MARGIN * 2, texH: map.rows * CELL + BOARD_MARGIN * 2, entries, mul, cardH: CARD_PAD * 2 + prevH + 10 + y };
    });
    const cardsW = cardW * 3 + CARD_GAP * 2;
    const cardsH = Math.max(...cards.map((c) => c.cardH));

    const kids: Phaser.GameObjects.GameObject[] = [];
    cards.forEach((c, i) => {
      const cx = -cardsW / 2 + cardW / 2 + i * (cardW + CARD_GAP);
      const cy = cardsH / 2;
      const card = makeButton(this, cx, cy, '', () => this.start(i), { width: cardW, height: c.cardH, radius: 20 });
      card.label.setVisible(false);
      kids.push(card.container);
      // The preview: painted at 1 px, so it is scaled to its box directly (never artScale).
      const img = this.add.image(0, 0, c.key);
      img.setScale(Math.min(prevW / c.texW, prevH / c.texH));
      img.setPosition(cx, cy - c.cardH / 2 + CARD_PAD + prevH / 2);
      kids.push(img);
      // The column: name over line per augment, the multiplier under them.
      const colX = cx - cardW / 2 + CARD_PAD;
      const colTop = cy - c.cardH / 2 + CARD_PAD + prevH + 10;
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
    return { obj: this.add.container(0, 0, kids), w: cardsW, h: cardsH };
  }

  /**
   * Portrait: the three boards as thumbnails (the selected one lifted with an ink ring), one
   * detail card for the selected board — a big preview beside its name, its road (length and
   * bends) and the level augments it carries — and Play under it.
   */
  private buildDetail(width: number, maps: GameMap[]): Part {
    const narrow = isNarrow(width);
    const kids: Phaser.GameObjects.GameObject[] = [];

    // The thumbnails: a tap (or its key) selects.
    const tw = THUMB_W + 16;
    const th = 8 + THUMB_H + 6 + 16 + 8;
    const rowW = tw * 3 + THUMB_GAP * 2;
    maps.forEach((map, i) => {
      const thumb: Button = makeButton(this, -rowW / 2 + tw / 2 + i * (tw + THUMB_GAP), th / 2, '', () => this.pickBoard(i), { width: tw, height: th, radius: 16 });
      thumb.label.setVisible(false);
      const img = this.preview(i, map, THUMB_W, THUMB_H).setY(-th / 2 + 8 + THUMB_H / 2);
      const num = this.add.text(0, th / 2 - 8 - 8, String(i + 1), textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
      thumb.content.add([img, num]);
      thumb.setSelected(i === this.sel);
      kids.push(thumb.container);
    });
    let y = th + 16;

    // The detail card: the column's texts first, so they set the card's height.
    const cardW = Math.min(380, width - 32);
    const colW = cardW - 32 - DETAIL_W - 18;
    const colX = -cardW / 2 + 16 + DETAIL_W + 18;
    const top = y + 16;
    const map = maps[this.sel]!;
    const ids = dailyLevel(this.seeds[this.sel]!, this.level);
    const col: Phaser.GameObjects.GameObject[] = [];
    let cy = 0;
    const put = (t: Phaser.GameObjects.Text, after: number): void => {
      t.setPosition(colX, top + cy);
      cy += t.height + after;
      col.push(t);
    };
    put(this.add.text(0, 0, `Board ${this.sel + 1}`, textStyle(20, PALETTE.ink, { fontStyle: 'bold' })), 6);
    put(this.add.text(0, 0, `road ${map.path.length} cells · ${roadBends(map.path)} bends`, textStyle(13, PALETTE.muted, { wordWrap: { width: colW } })), 8);
    if (ids.length === 0) {
      put(this.add.text(0, 0, 'no level augments', textStyle(13, PALETTE.muted)), 0);
    } else {
      col.push(this.add.rectangle(colX, top + cy + 2, colW, 1, PALETTE.cardDeep).setOrigin(0, 0));
      cy += 12;
      for (const id of ids) {
        const def = getLevelAugment(id);
        if (!def) continue;
        put(this.add.text(0, 0, def.name, textStyle(14, PALETTE.ink, { fontStyle: 'bold' })), 2);
        put(this.add.text(0, 0, def.line, textStyle(13, PALETTE.muted, { wordWrap: { width: colW }, lineSpacing: 2 })), 8);
      }
      put(this.add.text(0, 0, levelMultiplierLabel(ids), textStyle(18, PALETTE.ink, { fontStyle: 'bold' })), 0);
    }
    const cardH = 32 + Math.max(DETAIL_H, cy);
    kids.push(makeCard(this, 0, y + cardH / 2, cardW, cardH, 22));
    kids.push(this.preview(this.sel, map, DETAIL_W, DETAIL_H).setPosition(-cardW / 2 + 16 + DETAIL_W / 2, top + DETAIL_H / 2));
    kids.push(...col);
    y += cardH + 16;

    // Play: starts the run on the selected board.
    const play = makeButton(this, 0, y + PLAY_H / 2, `Play board ${this.sel + 1}`, () => this.start(this.sel), { width: PLAY_W, height: PLAY_H, fontSize: 22, radius: PLAY_H / 2, fill: PALETTE.ink });
    kids.push(play.container);
    if (!narrow) kids.push(this.add.text(PLAY_W / 2 + 12, y + PLAY_H / 2, 'Enter', textStyle(11, PALETTE.faint, { fontStyle: 'bold' })).setOrigin(0, 0.5));
    y += PLAY_H;
    return { obj: this.add.container(0, 0, kids), w: Math.max(rowW, cardW, PLAY_W), h: y };
  }

  /** Back, with its key beside it on a keyboard screen. */
  private buildBack(narrow: boolean): Part {
    const esc = this.add.text(0, 0, 'Esc', textStyle(11, PALETTE.faint, { fontStyle: 'bold' })).setOrigin(0.5);
    if (narrow) esc.setVisible(false);
    const back = makeButton(this, 0, 0, 'Back', () => this.back(), { width: 160, height: 52, radius: 26 });
    const w = 160 + (narrow ? 0 : 12 + esc.width);
    back.container.setPosition(-w / 2 + 80, 26);
    esc.setPosition(w / 2 - esc.width / 2, 26);
    return { obj: this.add.container(0, 0, [back.container, esc]), w, h: 52 };
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

  /** A thumbnail tap (portrait): the selected board lives in a field, rebuilt like a level tap. */
  private pickBoard(i: number): void {
    if (this.closed || i < 0 || i >= this.seeds.length || i === this.sel) return;
    this.sel = i;
    getSfx(this)?.blip();
    this.time.delayedCall(50, () => this.build());
  }

  /** Starts the run on board i: that board's seed, and its level augments at the chosen level. */
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
