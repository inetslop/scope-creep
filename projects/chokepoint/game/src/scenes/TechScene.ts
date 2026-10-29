import Phaser from 'phaser';
import { artScale, COIN_TEXTURE } from '../art/textures';
import { AUGMENTS } from '../content/augments';
import { cssColor, PALETTE } from '../content/palette';
import { CLAIM_NODES } from '../content/tech/claim';
import { POOL_NODES } from '../content/tech/pool';
import { DRAFT_NODES } from '../content/tech/draft';
import { loadProfile, type Profile } from '../core/profile';
import { branchPrice, buyClaimNode, buyNode, buyPoolNode, ownedInBranch, TECH_NODES } from '../core/tech';
import { hook } from '../debug/testHook';
import { makeButton, type Button } from '../ui/button';
import { makeCard } from '../ui/card';
import { pointerCss, uiCamera, viewSize } from '../ui/display';
import { textStyle, titleStyle } from '../ui/text';
import { getSfx, onResize, SCENES } from './keys';

/**
 * The tech tree: the coins runs earn become spendable here, on lasting changes. Four branches,
 * one row each: "Run start" (new runs begin richer), "The draft" (a new run's second slot costs
 * less and its pre-wave-1 draft offers a fourth card), "The pool" (a new augment joins the
 * game's content) and "The claim" (a run pays more for the same holding). The menu sits dimmed
 * behind, and a purchase is saved straight into the profile (the coins are spent, not moved).
 */
interface RowNode {
  id: string;
  name: string;
  line: string;
  price: number;
  requires: string | null;
  unlocks: string | null;
  branch: 'start' | 'draft' | 'pool' | 'claim';
}

interface TechCard {
  node: RowNode;
  button: Button;
  price: Phaser.GameObjects.Text;
  full: Phaser.GameObjects.Text;
  strike: Phaser.GameObjects.Graphics;
  coin: Phaser.GameObjects.Image;
  border: Phaser.GameObjects.Graphics;
  h: number; // this card's (its row's) height
}

/** One muted label per card row, in row order. */
const ROW_LABELS = ['Run start', 'The draft', 'The pool', 'The claim'];

// Each card is a column laid out top-down: the name, then the description (top-aligned, so it
// only grows down), then the price line pinned to the bottom, the same padding top and bottom.
// The row takes its tallest card's height, and the panel takes the rows plus the menu.
const CARD_W = 160;
const WRAP_W = 132; // card width minus its side padding
const PAD_TOP = 12; // card top and bottom padding
const GAP_ND = 7; // name -> description
const GAP_DP = 12; // description -> price line
const PRICE_H = 18; // price line height
const MARGIN = 40; // panel top padding (-> title center) AND bottom padding (menu bottom -> panel edge): equal
const BALANCE_GAP = 44; // title center -> balance center
const HEADER_TO_LABEL = 26; // balance center -> first row's label
const LABEL_TO_CARDS = 18; // label center -> first card top
const GRID_GAP = 12; // between grid rows inside one row (narrow)
const ROW_GAP = 30; // last card bottom -> next row label
const MENU_GAP = 30; // last row bottom -> menu top
const MENU_H = 52;

export class TechScene extends Phaser.Scene {
  private profile!: Profile;
  private kind: 'wide' | 'narrow' = 'narrow';
  private panelW = 0;
  private panelH = 0;
  private box?: Phaser.GameObjects.Container;
  private shade!: Phaser.GameObjects.Rectangle;
  private arrow!: Phaser.GameObjects.Graphics;
  private balanceText!: Phaser.GameObjects.Text;
  private balanceIcon!: Phaser.GameObjects.Image;
  private cards: TechCard[] = [];
  private rowDots: Phaser.GameObjects.Arc[] = [];
  private rows: RowNode[][] = [
    TECH_NODES.map((n) => ({ id: n.id, name: n.name, line: n.line, price: n.price, requires: n.requires, unlocks: null, branch: 'start' })),
    DRAFT_NODES.map((n) => ({ id: n.id, name: n.name, line: n.line, price: n.price, requires: n.requires, unlocks: null, branch: 'draft' })),
    POOL_NODES.map((n) => ({ id: n.id, name: n.name, line: n.line, price: n.price, requires: null, unlocks: n.unlocks, branch: 'pool' })),
    CLAIM_NODES.map((n) => ({ id: n.id, name: n.name, line: n.line, price: n.price, requires: null, unlocks: null, branch: 'claim' })),
  ];
  private dragOffset = 0;
  private dragging = false;
  private minBoxY = 0;
  private maxBoxY = 0;
  private scrollable = false;

  constructor() {
    super(SCENES.tech);
  }

  create(): void {
    uiCamera(this);
    hook.overlay = SCENES.tech;
    this.profile = loadProfile(window.localStorage);
    // The menu stays behind: the shade dims it, so this scene paints no background of its own,
    // and a tap on the dimmed area does nothing.
    this.shade = this.add.rectangle(0, 0, 10, 10, PALETTE.ground, 0.78).setOrigin(0).setDepth(1).setInteractive();
    // The down arrow is a scene-level cue at the screen's bottom edge, not a child of the box:
    // when the panel overflows the screen its own bottom is off-screen and would hide the cue.
    this.arrow = this.add.graphics().setDepth(3);
    this.arrow.fillStyle(PALETTE.muted, 1);
    this.arrow.fillTriangle(-9, -5, 9, -5, 0, 5);
    this.arrow.setVisible(false);
    const size = viewSize(this);
    this.kind = size.width >= 740 ? 'wide' : 'narrow';
    this.rebuild();
    const layout = (width: number, height: number): void => {
      this.shade.setSize(width, height);
      this.shade.input?.hitArea.setTo(0, 0, width, height);
      const kind = width >= 740 ? 'wide' : 'narrow';
      if (kind !== this.kind) {
        this.kind = kind;
        this.rebuild();
      }
      const box = this.box!;
      const s = Math.min(1, (width - 24) / this.panelW); // the rows, not the width, decide overflow
      box.setScale(s);
      const half = (this.panelH * s) / 2;
      this.minBoxY = 12 + half;
      this.maxBoxY = height - 12 - half;
      this.scrollable = this.minBoxY > this.maxBoxY; // the rows are taller than the screen
      if (this.scrollable) {
        box.x = width / 2;
        box.y = Phaser.Math.Clamp(box.y, this.maxBoxY, this.minBoxY); // while overflowing, maxBoxY is the low end
      } else {
        box.setPosition(width / 2, height / 2);
      }
      this.arrow.setPosition(width / 2, height - 18);
      this.arrow.setVisible(this.scrollable && box.y > this.maxBoxY + 0.5); // the panel's bottom hangs below the screen
    };
    layout(size.width, size.height);
    onResize(this, layout);
    this.input.on('pointermove', this.onDrag);
    this.input.on('pointerup', this.onDragEnd);
    this.input.on('pointerupoutside', this.onDragEnd);
    this.events.once('shutdown', () => {
      this.input.off('pointermove', this.onDrag);
      this.input.off('pointerup', this.onDragEnd);
      this.input.off('pointerupoutside', this.onDragEnd);
    });
  }

  /** The card's content, built for one width class; a resize that flips the class rebuilds it. */
  private rebuild(): void {
    this.box?.destroy();
    this.cards = [];
    this.rowDots = [];
    this.dragging = false;
    const wide = this.kind === 'wide';
    // The widest row decides the panel's width: 172 between cards, 160 card, 20 at each side.
    const maxRow = Math.max(...this.rows.map((r) => r.length));
    this.panelW = wide ? Math.max(716, (maxRow - 1) * 172 + 200) : 356;

    // Pass A: build each card's texts, size the name to fit, and let the row take its tallest card.
    interface Measured {
      node: RowNode;
      name: Phaser.GameObjects.Text;
      desc: Phaser.GameObjects.Text;
      price: Phaser.GameObjects.Text;
      h: number;
    }
    const measured: Measured[][] = this.rows.map((row) => {
      const rowCards: Measured[] = row.map((node) => {
        const name = this.add.text(0, 0, node.name, textStyle(16, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5, 0);
        let size = 16;
        while (name.width > WRAP_W && size > 13) {
          size -= 1;
          name.setFontSize(size);
        }
        const desc = this.add.text(0, 0, node.line, textStyle(13, PALETTE.muted, { align: 'center', wordWrap: { width: WRAP_W }, lineSpacing: 2 })).setOrigin(0.5, 0);
        const price = this.add.text(0, 0, String(node.price), textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
        return { node, name, desc, price, h: PAD_TOP + name.height + GAP_ND + desc.height + GAP_DP + PRICE_H + PAD_TOP };
      });
      const rowH = Math.max(...rowCards.map((c) => c.h)); // every card in the row shares its tallest height
      rowCards.forEach((c) => { c.h = rowH; });
      return rowCards;
    });

    // Pass B: top-down vertical positions. The header, then each row (label, then its grid rows),
    // then the menu; top and bottom padding are both MARGIN.
    let top = MARGIN + BALANCE_GAP + HEADER_TO_LABEL;
    const labelYs: number[] = [];
    const cardTops: number[][] = [];
    measured.forEach((rowCards) => {
      const labelC = top + 8;
      labelYs.push(labelC);
      const gridCount = wide ? 1 : Math.ceil(rowCards.length / 2);
      let y = labelC + LABEL_TO_CARDS;
      const tops: number[] = [];
      for (let g = 0; g < gridCount; g++) {
        tops.push(y);
        y += rowCards[0].h + (g < gridCount - 1 ? GRID_GAP : 0);
      }
      cardTops.push(tops);
      top = y + ROW_GAP; // y is the bottom of the row's last grid row
    });
    const menuTop = top - ROW_GAP + MENU_GAP;
    const menuC = menuTop + MENU_H / 2;
    this.panelH = menuTop + MENU_H + MARGIN;

    // Pass C: build the panel, header, rows and menu at the computed positions.
    const panel = makeCard(this, 0, 0, this.panelW, this.panelH, 28);
    const title = this.add.text(0, -this.panelH / 2 + MARGIN, 'Tech', titleStyle(32)).setOrigin(0.5);
    const number = this.add.text(0, -this.panelH / 2 + MARGIN + BALANCE_GAP, String(this.profile.coins), textStyle(28, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
    const coin = artScale(this.add.image(0, -this.panelH / 2 + MARGIN + BALANCE_GAP, COIN_TEXTURE), 1.4);
    this.balanceText = number;
    this.balanceIcon = coin;
    this.centerBalance();
    const exit = (): void => {
      hook.overlay = '';
      this.scene.start(SCENES.menu);
    };
    const parts: Phaser.GameObjects.GameObject[] = [panel, title, coin, number];
    this.rows.forEach((row, r) => {
      const label = this.add.text(0, -this.panelH / 2 + labelYs[r], ROW_LABELS[r], textStyle(14, PALETTE.muted)).setOrigin(0.5);
      // The done mark: the tree's accent dot at the right edge of the title line, only while every node is owned.
      const dot = this.add.circle(label.width / 2 + 9, -this.panelH / 2 + labelYs[r], 3, PALETTE.yellow).setVisible(false);
      this.rowDots.push(dot);
      parts.push(label, dot);
      row.forEach((node, i) => {
        const m = measured[r][i];
        const grid = wide ? 0 : Math.floor(i / 2);
        const lastOdd = row.length % 2 === 1 && i === row.length - 1; // an odd narrow row ends alone in the middle
        const x = wide ? (i - (row.length - 1) / 2) * 172 : i % 2 === 0 ? (lastOdd ? 0 : -86) : 86;
        const button = makeButton(this, 0, 0, '', () => this.buy(node), { width: CARD_W, height: m.h, radius: 16, fadeWhenDisabled: false });
        const priceY = m.h / 2 - PAD_TOP - PRICE_H / 2; // the price line, pinned to the card's bottom
        m.name.setPosition(0, -m.h / 2 + PAD_TOP);
        m.desc.setPosition(0, -m.h / 2 + PAD_TOP + m.name.height + GAP_ND);
        m.price.setPosition(0, priceY);
        const full = this.add.text(0, priceY, '', textStyle(13, PALETTE.muted, { fontStyle: 'bold' })).setOrigin(0, 0.5);
        const strike = this.add.graphics();
        const nodeCoin = artScale(this.add.image(0, priceY, COIN_TEXTURE), 12 / 28);
        button.content.add([m.name, m.desc, m.price, full, strike, nodeCoin]);
        const border = this.add.graphics();
        button.container.add(border); // a sibling of the content, so it never lifts with the card
        button.container.setPosition(x, -this.panelH / 2 + cardTops[r][grid] + m.h / 2);
        this.cards.push({ node, button, price: m.price, full, strike, coin: nodeCoin, border, h: m.h });
        parts.push(button.container);
      });
    });
    parts.push(makeButton(this, 0, -this.panelH / 2 + menuC, 'Menu', exit, { width: 240, height: MENU_H, radius: 26 }).container);
    // The panel itself is the scroll handle: when the rows don't fit the screen, a press on its
    // empty area drags the box vertically. A press on a card never starts one (the check below),
    // so scrolling and buying can't happen with the same finger.
    panel.setInteractive();
    panel.on('pointerdown', (p: Phaser.Input.Pointer): void => {
      if (!this.scrollable) return;
      if (this.input.hitTestPointer(p).some((o) => o !== panel && o !== this.shade)) return;
      this.dragOffset = pointerCss(p).y - this.box!.y;
      this.dragging = true;
    });
    this.box = this.add.container(0, 0, parts).setDepth(2);
    this.refresh();
  }

  /** Keeps the balance row (coin, gap, bold number) centered as the number's width changes. */
  private centerBalance(): void {
    const coinW = 28 * 1.4; // the coin shown at artScale 1.4
    const w = coinW + 16 + this.balanceText.width;
    this.balanceIcon.x = -w / 2 + coinW / 2;
    this.balanceText.x = -w / 2 + coinW + 16 + this.balanceText.width / 2;
  }

  /**
   * Every node card: owned (yellow border), locked (needs the previous one), "not in the game
   * yet" (the augment it unlocks is not in the content yet), or for sale (red price when
   * unaffordable).
   */
  private refresh(): void {
    for (const c of this.cards) {
      const owned = this.profile.purchased.includes(c.node.id);
      const unlocked = c.node.requires === null || this.profile.purchased.includes(c.node.requires);
      const inContent = c.node.unlocks === null || AUGMENTS.some((a) => a.id === c.node.unlocks);
      const row = this.rows.find((r) => r.some((n) => n.id === c.node.id))!;
      const ownedCount = ownedInBranch(row, this.profile.purchased);
      const now = branchPrice(c.node.price, ownedCount);
      const afford = this.profile.coins >= now;
      c.border.clear();
      if (owned) {
        c.border.lineStyle(2, PALETTE.yellow, 1);
        c.border.strokeRoundedRect(-CARD_W / 2 + 1, -c.h / 2 + 1, CARD_W - 2, c.h - 2, 17);
        c.price.setText('owned').setColor(cssColor(PALETTE.muted));
        c.price.x = -c.price.width / 2; // the price text is left-origin (the coin row); center it on its own
        c.coin.setVisible(false);
        c.full.setVisible(false);
        c.strike.setVisible(false);
        c.button.content.setAlpha(1);
      } else if (!unlocked) {
        c.price.setText('needs the previous').setColor(cssColor(PALETTE.muted));
        c.price.x = -c.price.width / 2;
        c.coin.setVisible(false);
        c.full.setVisible(false);
        c.strike.setVisible(false);
        c.button.content.setAlpha(0.5);
      } else if (!inContent) {
        c.price.setText('not in the game yet').setColor(cssColor(PALETTE.muted));
        c.price.x = -c.price.width / 2;
        c.coin.setVisible(false);
        c.full.setVisible(false);
        c.strike.setVisible(false);
        c.button.content.setAlpha(0.5);
      } else if (ownedCount === 0) {
        c.price.setText(String(c.node.price)).setColor(cssColor(afford ? PALETTE.ink : PALETTE.red));
        const w = 20 + c.price.width;
        c.coin.x = -w / 2 + 6;
        c.price.x = -w / 2 + 20;
        c.full.setVisible(false);
        c.strike.setVisible(false);
        c.coin.setVisible(true);
        c.button.content.setAlpha(afford ? 1 : 0.6);
      } else {
        c.full.setText(String(c.node.price));
        c.price.setText(String(now)).setColor(cssColor(afford ? PALETTE.ink : PALETTE.red));
        const w = 20 + c.full.width + 8 + c.price.width;
        c.coin.x = -w / 2 + 6;
        c.full.x = -w / 2 + 20;
        c.price.x = -w / 2 + 20 + c.full.width + 8;
        c.strike.clear();
        c.strike.lineStyle(1, PALETTE.muted, 1);
        const strikeY = c.h / 2 - PAD_TOP - PRICE_H / 2; // the card's price line
        c.strike.lineBetween(c.full.x, strikeY, c.full.x + c.full.width, strikeY);
        c.full.setVisible(true);
        c.strike.setVisible(true);
        c.coin.setVisible(true);
        c.button.content.setAlpha(afford ? 1 : 0.6);
      }
      c.button.setEnabled(afford && unlocked && inContent && !owned);
    }
    this.rows.forEach((row, r) => {
      this.rowDots[r].setVisible(row.every((n) => this.profile.purchased.includes(n.id)));
    });
  }

  private buy(node: RowNode): void {
    // A pool node sits on sale only once the augment it unlocks is in the game's content.
    if (node.unlocks !== null && !AUGMENTS.some((a) => a.id === node.unlocks)) return;
    const bought =
      node.branch === 'start' || node.branch === 'draft'
        ? buyNode(window.localStorage, node.id)
        : node.branch === 'pool'
          ? buyPoolNode(window.localStorage, node.id)
          : buyClaimNode(window.localStorage, node.id);
    if (!bought) return;
    this.profile = loadProfile(window.localStorage);
    getSfx(this)?.techBuy();
    this.balanceText.setText(String(this.profile.coins));
    this.centerBalance();
    const base = this.balanceIcon.scale;
    this.tweens.add({ targets: this.balanceText, scale: 1.15, duration: 75, yoyo: true, repeat: 1, ease: 'Quad.easeOut', onComplete: () => this.balanceText.setScale(1) });
    this.tweens.add({ targets: this.balanceIcon, scale: base * 1.15, duration: 75, yoyo: true, repeat: 1, ease: 'Quad.easeOut', onComplete: () => this.balanceIcon.setScale(base) });
    this.refresh();
  }

  /** While a press started on the panel's empty area, drag the box within the screen's range. */
  private onDrag = (p: Phaser.Input.Pointer): void => {
    if (!this.dragging || !this.box) return;
    this.box.y = Phaser.Math.Clamp(pointerCss(p).y - this.dragOffset, this.maxBoxY, this.minBoxY);
    this.arrow.setVisible(this.box.y > this.maxBoxY + 0.5);
  };

  private onDragEnd = (): void => {
    this.dragging = false;
  };
}
