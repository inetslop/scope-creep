import Phaser from 'phaser';
import { artScale, COIN_TEXTURE } from '../art/textures';
import { AUGMENTS } from '../content/augments';
import { cssColor, PALETTE } from '../content/palette';
import { BOARD_NODES } from '../content/tech/board';
import { CLAIM_NODES } from '../content/tech/claim';
import { POOL_NODES } from '../content/tech/pool';
import { DRAFT_NODES } from '../content/tech/draft';
import { WAVE_NODES } from '../content/tech/wave';
import { TOWER_NODES } from '../content/tech/tower';
import { EXIT_NODES } from '../content/tech/exit';
import { KILL_NODES } from '../content/tech/kill';
import { BANK_NODES } from '../content/tech/bank';
import { loadProfile, type Profile } from '../core/profile';
import { buyBankNode, buyBoardNode, buyClaimNode, buyExitNode, buyKillNode, buyNode, buyPoolNode, buyTowerNode, buyWaveNode, nodeCost, TECH_NODES } from '../core/tech';
import { layoutTree } from '../core/techTree';
import { hook } from '../debug/testHook';
import { makeButton, type Button } from '../ui/button';
import { cardTexture, makeCard, markCard } from '../ui/card';
import { pointerCss, uiCamera, viewSize } from '../ui/display';
import { textStyle, titleStyle } from '../ui/text';
import { getSfx, onKey, onResize, SCENES } from './keys';

/**
 * The tech tree: the coins runs earn become spendable here, on lasting changes. Ten branches,
 * one column each: "Run start" (new runs begin richer), "The draft" (a new run's second slot costs
 * less and its pre-wave-1 draft offers a fourth card), "The pool" (a new augment joins the
 * game's content), "The claim" (a run pays more for the same holding), "The board" (new runs'
 * roads wind further), "The wave" (how a run plays), "The tower" (how the run's towers are sold
 * back), "The exit" (how long a leak is seen coming), "The kill" (how a kill pays) and "The bank"
 * (how the run's bank pays). Inside a column the nodes are drawn as a tree from their `requires`
 * (core/techTree.ts): a line runs from a node down to each node that needs it, and a fork spreads
 * sideways. A tap (or click, or the arrow keys) picks a node; the sheet at the bottom tells what
 * it does and buys it. The tree pans when it is bigger than the screen (drag, the wheel, the side
 * arrows). A purchase is saved straight into the profile (the coins are spent, not moved).
 */
interface RowNode {
  id: string;
  name: string;
  line: string;
  price: number;
  requires: string | null;
  unlocks: string | null;
  branch: 'start' | 'draft' | 'pool' | 'claim' | 'board' | 'wave' | 'tower' | 'exit' | 'kill' | 'bank';
}

interface NodeView {
  node: RowNode;
  row: number;
  parent: NodeView | null;
  x: number; // center, in the tree's content
  y: number;
  lift: Phaser.GameObjects.Container; // everything that rises on hover and selection
  card: Phaser.GameObjects.Image;
  ring: Phaser.GameObjects.Graphics;
  price: Phaser.GameObjects.Text;
  coin: Phaser.GameObjects.Image;
  hover: boolean;
}

/** One muted label per branch column, in row order. */
const ROW_LABELS = ['Run start', 'The draft', 'The pool', 'The claim', 'The board', 'The wave', 'The tower', 'The exit', 'The kill', 'The bank'];

const NODE_W = 108;
const NODE_H = 62;
const SLOT = 120; // between two side-by-side nodes' centers (and one column's width per slot)
const STEP = 88; // a node's top to the next depth's top: the gap holds the connector
const LABEL_H = 34; // a column's label band, above its first node
const PAD = 12; // around the tree's content
const LINE_W = 4; // connector thickness
const BAR_H = 72; // the top bar: title, balance, menu
const BUY_W = 132;
const BUY_H = 52;
const SHEET_PAD = 16;
const DRAG_SLOP = 8; // a press that moves less than this is a tap, not a pan

export class TechScene extends Phaser.Scene {
  private profile!: Profile;
  private rows: RowNode[][] = [
    TECH_NODES.map((n) => ({ id: n.id, name: n.name, line: n.line, price: n.price, requires: n.requires, unlocks: null, branch: 'start' })),
    DRAFT_NODES.map((n) => ({ id: n.id, name: n.name, line: n.line, price: n.price, requires: n.requires, unlocks: null, branch: 'draft' })),
    POOL_NODES.map((n) => ({ id: n.id, name: n.name, line: n.line, price: n.price, requires: null, unlocks: n.unlocks, branch: 'pool' })),
    CLAIM_NODES.map((n) => ({ id: n.id, name: n.name, line: n.line, price: n.price, requires: n.requires, unlocks: null, branch: 'claim' })),
    BOARD_NODES.map((n) => ({ id: n.id, name: n.name, line: n.line, price: n.price, requires: null, unlocks: null, branch: 'board' })),
    WAVE_NODES.map((n) => ({ id: n.id, name: n.name, line: n.line, price: n.price, requires: null, unlocks: null, branch: 'wave' })),
    TOWER_NODES.map((n) => ({ id: n.id, name: n.name, line: n.line, price: n.price, requires: null, unlocks: null, branch: 'tower' })),
    EXIT_NODES.map((n) => ({ id: n.id, name: n.name, line: n.line, price: n.price, requires: null, unlocks: null, branch: 'exit' })),
    KILL_NODES.map((n) => ({ id: n.id, name: n.name, line: n.line, price: n.price, requires: null, unlocks: null, branch: 'kill' })),
    BANK_NODES.map((n) => ({ id: n.id, name: n.name, line: n.line, price: n.price, requires: null, unlocks: null, branch: 'bank' })),
  ];
  private views: NodeView[] = [];
  private selected?: NodeView;
  private world!: Phaser.GameObjects.Container;
  private lines!: Phaser.GameObjects.Graphics;
  private rowDots: Phaser.GameObjects.Arc[] = [];
  private contentW = 0;
  private contentH = 0;
  // The tree's window on screen (between the bar and the sheet) and how far the content is panned in it.
  private view = { x: 0, y: 0, w: 0, h: 0 };
  scrollX = 0; // public for the pan tween
  scrollY = 0;
  private press?: { x: number; y: number; sx: number; sy: number };
  private moved = false;
  private balanceText!: Phaser.GameObjects.Text;
  private balanceIcon!: Phaser.GameObjects.Image;
  private sheet!: Phaser.GameObjects.Image;
  private sheetW = 0;
  private sheetH = 0;
  private sheetBranch!: Phaser.GameObjects.Text;
  private sheetName!: Phaser.GameObjects.Text;
  private sheetLine!: Phaser.GameObjects.Text;
  private sheetStatus!: Phaser.GameObjects.Text;
  private buyButton!: Button;
  private buyCoin!: Phaser.GameObjects.Image;
  private buyHint!: Phaser.GameObjects.Text;
  private bottomBand!: Phaser.GameObjects.Rectangle;
  private leftArrow!: Button;
  private rightArrow!: Button;

  constructor() {
    super(SCENES.tech);
  }

  create(): void {
    uiCamera(this);
    hook.overlay = SCENES.tech;
    this.profile = loadProfile(window.localStorage);
    this.views = [];
    this.rowDots = [];
    this.selected = undefined;
    this.scrollX = 0;
    this.scrollY = 0;
    // A full-screen ground: the tree pans under the bar and the sheet, which hide what leaves the window.
    const bg = this.add.rectangle(0, 0, 10, 10, PALETTE.ground, 1).setOrigin(0).setInteractive();
    this.buildTree();
    const topBand = this.add.rectangle(0, 0, 10, BAR_H, PALETTE.ground, 1).setOrigin(0).setDepth(2).setInteractive();
    this.bottomBand = this.add.rectangle(0, 0, 10, 10, PALETTE.ground, 1).setOrigin(0).setDepth(2).setInteractive();

    const exit = (): void => {
      hook.overlay = '';
      this.scene.start(SCENES.menu);
    };
    const title = this.add.text(20, BAR_H / 2, 'Tech', titleStyle(28)).setOrigin(0, 0.5).setDepth(3);
    this.balanceIcon = artScale(this.add.image(title.x + title.width + 30, BAR_H / 2, COIN_TEXTURE), 1).setDepth(3);
    this.balanceText = this.add.text(this.balanceIcon.x + 18, BAR_H / 2, String(this.profile.coins), textStyle(24, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5).setDepth(3);
    const menu = makeButton(this, 0, BAR_H / 2, 'Menu', exit, { width: 112, height: 44, radius: 22, fontSize: 18 });
    menu.container.setDepth(3);
    const escHint = this.add.text(0, BAR_H / 2, 'Esc', textStyle(11, PALETTE.faint, { fontStyle: 'bold' })).setOrigin(1, 0.5).setDepth(3);
    const keysHint = this.add.text(0, BAR_H / 2, 'Arrow keys choose', textStyle(11, PALETTE.faint, { fontStyle: 'bold' })).setOrigin(0.5).setDepth(3);

    this.sheet = makeCard(this, 0, 0, 10, 10, 20).setDepth(3);
    this.sheetBranch = this.add.text(0, 0, '', textStyle(12, PALETTE.muted, { fontStyle: 'bold' })).setDepth(3);
    this.sheetName = this.add.text(0, 0, '', titleStyle(18)).setDepth(3);
    this.sheetLine = this.add.text(0, 0, '', textStyle(14, PALETTE.muted, { lineSpacing: 2 })).setDepth(3);
    this.sheetStatus = this.add.text(0, 0, '', textStyle(13, PALETTE.muted, { fontStyle: 'bold' })).setDepth(3);
    this.buyButton = makeButton(this, 0, 0, 'Buy', () => this.buySelected(), { width: BUY_W, height: BUY_H, radius: BUY_H / 2, fill: PALETTE.ink, fontSize: 18 });
    this.buyButton.container.setDepth(3);
    this.buyCoin = artScale(this.add.image(0, 0, COIN_TEXTURE), 14 / 28);
    this.buyButton.content.add(this.buyCoin);
    this.buyHint = this.add.text(0, 0, 'Enter', textStyle(11, PALETTE.faint, { fontStyle: 'bold' })).setOrigin(0.5, 0).setDepth(3);

    this.leftArrow = this.makeArrow(-1);
    this.rightArrow = this.makeArrow(1);

    this.refresh();
    const first = this.views.find((v) => this.buyable(v)) ?? this.views.find((v) => this.state(v) === 'open') ?? this.views[0];

    const layout = (width: number, height: number): void => {
      const narrow = width < 600;
      bg.setSize(width, height);
      bg.input?.hitArea.setTo(0, 0, width, height);
      topBand.setSize(width, BAR_H);
      topBand.input?.hitArea.setTo(0, 0, width, BAR_H);
      menu.container.x = width - 12 - 56;
      escHint.setPosition(menu.container.x - 56 - 10, BAR_H / 2).setVisible(!narrow);
      keysHint.setPosition(width / 2, BAR_H / 2).setVisible(width >= 760);
      this.layoutSheet(width, height, narrow);
      this.view = { x: 0, y: BAR_H, w: width, h: Math.max(0, height - BAR_H - this.sheetH - 24) };
      this.leftArrow.container.setPosition(30, this.view.y + this.view.h / 2);
      this.rightArrow.container.setPosition(width - 30, this.view.y + this.view.h / 2);
      this.pan(this.scrollX, this.scrollY);
      if (this.selected) this.reveal(this.selected, true); // a resize never leaves the picked node off-screen
    };
    layout(viewSize(this).width, viewSize(this).height);
    onResize(this, layout);
    if (first) this.select(first, true);

    this.input.on('pointerdown', this.onDown);
    this.input.on('pointermove', this.onMove);
    this.input.on('pointerup', this.onUp);
    this.input.on('pointerupoutside', this.onUp);
    this.input.on('wheel', this.onWheel);
    this.events.once('shutdown', () => {
      this.input.off('pointerdown', this.onDown);
      this.input.off('pointermove', this.onMove);
      this.input.off('pointerup', this.onUp);
      this.input.off('pointerupoutside', this.onUp);
      this.input.off('wheel', this.onWheel);
    });
    onKey(this, (e) => {
      if (e.key === 'Escape') exit();
      else if (e.key === 'Enter' || e.key === ' ') this.buySelected();
      else if (e.key === 'ArrowLeft') this.step(-1, 0);
      else if (e.key === 'ArrowRight') this.step(1, 0);
      else if (e.key === 'ArrowUp') this.step(0, -1);
      else if (e.key === 'ArrowDown') this.step(0, 1);
    });
  }

  /** The columns, side by side: each a lane with its label, its connectors and its node cards. */
  private buildTree(): void {
    this.world = this.add.container(0, 0).setDepth(1);
    const lanes = this.add.graphics();
    this.lines = this.add.graphics();
    this.world.add([lanes, this.lines]);
    let left = PAD;
    let tallest = 0;
    const columns: { left: number; width: number }[] = [];
    this.rows.forEach((row, r) => {
      const tree = layoutTree(row);
      const width = tree.width * SLOT;
      columns.push({ left, width });
      const label = this.add.text(left + width / 2, PAD + LABEL_H / 2, ROW_LABELS[r], textStyle(14, PALETTE.muted, { fontStyle: 'bold' })).setOrigin(0.5);
      // The done mark: the tree's accent dot after the label, only while every node is owned.
      const dot = this.add.circle(label.x + label.width / 2 + 9, label.y, 3, PALETTE.yellow).setVisible(false);
      this.rowDots.push(dot);
      this.world.add([label, dot]);
      const byId = new Map<string, NodeView>();
      for (const spot of tree.spots) {
        const node = row.find((n) => n.id === spot.id)!;
        const view = this.makeNode(node, r, left + spot.x * SLOT, PAD + LABEL_H + spot.y * STEP + NODE_H / 2);
        byId.set(node.id, view);
      }
      for (const spot of tree.spots) byId.get(spot.id)!.parent = spot.parent === null ? null : byId.get(spot.parent)!;
      tallest = Math.max(tallest, tree.height);
      left += width;
    });
    this.contentW = left + PAD;
    this.contentH = PAD + LABEL_H + tallest * STEP - (STEP - NODE_H) + PAD * 2;
    // Each branch sits on a lighter lane, so the columns read as separate trees.
    lanes.fillStyle(PALETTE.island, 1);
    for (const c of columns) lanes.fillRoundedRect(c.left + 4, PAD - 4, c.width - 8, this.contentH - PAD * 2 + 4, 16);
  }

  private makeNode(node: RowNode, row: number, x: number, y: number): NodeView {
    const card = this.add.image(0, 0, cardTexture(this, NODE_W, NODE_H, 14)).setScale(1 / 3);
    const ring = this.add.graphics();
    const name = this.add.text(0, -NODE_H / 2 + 8, node.name, textStyle(13, PALETTE.ink, { fontStyle: 'bold', align: 'center', wordWrap: { width: NODE_W - 14 } })).setOrigin(0.5, 0);
    for (let size = 12; name.height > 36 && size >= 10; size--) name.setFontSize(size); // two lines at most
    const price = this.add.text(0, NODE_H / 2 - 14, '', textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    const coin = artScale(this.add.image(0, NODE_H / 2 - 14, COIN_TEXTURE), 12 / 28);
    const lift = this.add.container(0, 0, [card, ring, name, price, coin]);
    const box = this.add.container(x, y, [lift]).setSize(NODE_W, NODE_H).setInteractive({ useHandCursor: true });
    const view: NodeView = { node, row, parent: null, x, y, lift, card, ring, price, coin, hover: false };
    box.on('pointerover', () => {
      view.hover = true;
      this.drawNode(view);
    });
    box.on('pointerout', () => {
      view.hover = false;
      this.drawNode(view);
    });
    box.on('pointerup', () => {
      if (!this.moved) this.select(view);
    });
    this.world.add(box);
    this.views.push(view);
    return view;
  }

  private makeArrow(dir: -1 | 1): Button {
    const arrow = makeButton(this, 0, 0, '', () => this.pan(this.scrollX - dir * (this.view.w - SLOT), this.scrollY, true), { width: 44, height: 44, radius: 22 });
    const tri = this.add.graphics();
    tri.fillStyle(PALETTE.ink, 1);
    tri.fillTriangle(-4 * dir, -8, -4 * dir, 8, 6 * dir, 0);
    arrow.content.add(tri);
    arrow.container.setDepth(2.5);
    return arrow;
  }

  /** The sheet's width and height for this screen: tall enough for the wordiest node, so it never jumps. */
  private layoutSheet(width: number, height: number, narrow: boolean): void {
    this.sheetW = Math.min(width - 24, 640);
    const textW = this.sheetW - SHEET_PAD * 2 - BUY_W - 16;
    this.sheetName.setWordWrapWidth(textW);
    this.sheetLine.setWordWrapWidth(textW);
    let textH = 0;
    for (const v of this.views) {
      this.sheetBranch.setText(ROW_LABELS[v.row]);
      this.sheetName.setText(v.node.name);
      this.sheetLine.setText(v.node.line);
      textH = Math.max(textH, this.sheetBranch.height + 2 + this.sheetName.height + 4 + this.sheetLine.height + 6 + 18);
    }
    this.sheetH = Math.max(BUY_H + (narrow ? 0 : 18), textH) + SHEET_PAD * 2;
    const top = height - 12 - this.sheetH;
    this.bottomBand.setPosition(0, top - 12).setSize(width, this.sheetH + 24);
    this.bottomBand.input?.hitArea.setTo(0, 0, width, this.sheetH + 24);
    this.sheet.setTexture(cardTexture(this, this.sheetW, this.sheetH, 20)).setPosition(width / 2, top + this.sheetH / 2);
    markCard(this.sheet, this.sheetW, this.sheetH);
    const left = width / 2 - this.sheetW / 2 + SHEET_PAD;
    this.sheetBranch.setPosition(left, top + SHEET_PAD);
    this.buyButton.container.setPosition(width / 2 + this.sheetW / 2 - SHEET_PAD - BUY_W / 2, top + this.sheetH / 2 - (narrow ? 0 : 9));
    this.buyHint.setPosition(this.buyButton.container.x, this.buyButton.container.y + BUY_H / 2 + 4).setVisible(!narrow);
    this.showSheet();
  }

  /** What a node is now: owned, open (on sale), locked (needs its parent) or soon (its augment isn't in the game yet). */
  private state(v: NodeView): 'owned' | 'open' | 'locked' | 'soon' {
    if (this.profile.purchased.includes(v.node.id)) return 'owned';
    if (v.node.requires !== null && !this.profile.purchased.includes(v.node.requires)) return 'locked';
    if (v.node.unlocks !== null && !AUGMENTS.some((a) => a.id === v.node.unlocks)) return 'soon';
    return 'open';
  }

  private cost(v: NodeView): number {
    return nodeCost(this.rows[v.row], v.node.id);
  }

  private buyable(v: NodeView): boolean {
    return this.state(v) === 'open' && this.profile.coins >= this.cost(v);
  }

  /** Every node card, the connectors, the done dots and the sheet, from the saved profile. */
  private refresh(): void {
    for (const v of this.views) this.drawNode(v);
    this.lines.clear();
    for (const v of this.views) {
      if (!v.parent) continue;
      // A line from the parent's bottom to the child's top; through a bend when the child sits to the side.
      this.lines.fillStyle(this.state(v.parent) === 'owned' ? PALETTE.yellow : PALETTE.faint, 1);
      const top = v.parent.y + NODE_H / 2;
      const bottom = v.y - NODE_H / 2;
      if (v.parent.x === v.x) {
        this.lines.fillRect(v.x - LINE_W / 2, top, LINE_W, bottom - top);
      } else {
        const mid = Math.round((top + bottom) / 2);
        this.lines.fillRect(v.parent.x - LINE_W / 2, top, LINE_W, mid - top);
        this.lines.fillRect(Math.min(v.parent.x, v.x) - LINE_W / 2, mid - LINE_W / 2, Math.abs(v.x - v.parent.x) + LINE_W, LINE_W);
        this.lines.fillRect(v.x - LINE_W / 2, mid, LINE_W, bottom - mid);
      }
    }
    this.rows.forEach((row, r) => this.rowDots[r].setVisible(row.every((n) => this.profile.purchased.includes(n.id))));
    this.balanceText.setText(String(this.profile.coins));
    this.showSheet();
  }

  /** One node card: yellow when owned, faded when it can't be bought yet, red price when the coins fall short. */
  private drawNode(v: NodeView): void {
    const state = this.state(v);
    const now = this.cost(v);
    const selected = this.selected === v;
    v.card.setTexture(cardTexture(this, NODE_W, NODE_H, 14, state === 'owned' ? PALETTE.yellow : PALETTE.card));
    if (state === 'owned') {
      v.price.setText('owned').setColor(cssColor(PALETTE.ink));
      v.coin.setVisible(false);
    } else if (state === 'soon') {
      v.price.setText('soon').setColor(cssColor(PALETTE.muted));
      v.coin.setVisible(false);
    } else {
      v.price.setText(String(now)).setColor(cssColor(state === 'open' && this.profile.coins < now ? PALETTE.red : state === 'locked' ? PALETTE.muted : PALETTE.ink));
      v.coin.setVisible(true);
    }
    if (v.coin.visible) {
      const w = 18 + v.price.width;
      v.coin.x = -w / 2 + 6;
      v.price.x = -w / 2 + 18;
    } else {
      v.price.x = -v.price.width / 2;
    }
    v.lift.setAlpha(state === 'locked' || state === 'soon' ? 0.5 : 1);
    v.ring.clear();
    if (selected) {
      v.ring.lineStyle(3, PALETTE.ink, 1);
      v.ring.strokeRoundedRect(-NODE_W / 2 - 1, -NODE_H / 2 - 1, NODE_W + 2, NODE_H + 2, 15);
    }
    v.lift.y = selected ? -3 : v.hover ? -2 : 0;
  }

  /** The bottom sheet: the selected node's branch, name, what it does, its state, and the buy button. */
  private showSheet(): void {
    const v = this.selected;
    if (!v || !this.sheetW) return;
    const state = this.state(v);
    const now = this.cost(v);
    this.sheetBranch.setText(ROW_LABELS[v.row]);
    this.sheetName.setText(v.node.name).setPosition(this.sheetBranch.x, this.sheetBranch.y + this.sheetBranch.height + 2);
    this.sheetLine.setText(v.node.line).setPosition(this.sheetBranch.x, this.sheetName.y + this.sheetName.height + 4);
    const parent = this.views.find((p) => p.node.id === v.node.requires);
    const [status, color]: [string, number] =
      state === 'owned' ? ['Owned', PALETTE.greenDeep]
      : state === 'locked' ? [`Needs ${parent?.node.name ?? 'the previous'} first`, PALETTE.muted]
      : state === 'soon' ? ['Not in the game yet', PALETTE.muted]
      : this.profile.coins < now ? [`${now - this.profile.coins} more coins needed`, PALETTE.red]
      : ['Ready to buy', PALETTE.greenDeep];
    this.sheetStatus.setText(status).setColor(cssColor(color)).setPosition(this.sheetBranch.x, this.sheetLine.y + this.sheetLine.height + 6);
    const label = this.buyButton.label;
    if (state === 'owned' || state === 'locked' || state === 'soon') {
      label.setText(state === 'owned' ? 'Owned' : state === 'locked' ? 'Locked' : 'Soon');
      label.x = 0;
      this.buyCoin.setVisible(false);
    } else {
      label.setText(`Buy ${now}`);
      const w = 22 + label.width;
      this.buyCoin.setVisible(true).setX(-w / 2 + 7);
      label.x = -w / 2 + 22 + label.width / 2;
    }
    this.buyButton.setEnabled(this.buyable(v));
  }

  private select(v: NodeView, instant = false): void {
    const before = this.selected;
    this.selected = v;
    if (before) this.drawNode(before);
    this.drawNode(v);
    this.showSheet();
    this.reveal(v, instant);
  }

  /** The arrow keys: the nearest node that way, by distance with sideways steps counting extra. */
  private step(dx: number, dy: number): void {
    const from = this.selected;
    if (!from) return;
    let best: NodeView | undefined;
    let bestScore = Infinity;
    for (const v of this.views) {
      const ox = v.x - from.x;
      const oy = v.y - from.y;
      const along = dx !== 0 ? ox * dx : oy * dy;
      if (along <= 0) continue;
      const score = along + 3 * Math.abs(dx !== 0 ? oy : ox);
      if (score < bestScore) {
        bestScore = score;
        best = v;
      }
    }
    if (best) this.select(best);
  }

  /** Pans the least that brings a node fully into the tree's window. */
  private reveal(v: NodeView, instant: boolean): void {
    const side = this.contentW > this.view.w ? 60 : 16; // clear of the side arrows
    const left = v.x - NODE_W / 2 - side;
    const right = v.x + NODE_W / 2 + side;
    const top = v.y - NODE_H / 2 - 16;
    const bottom = v.y + NODE_H / 2 + 16;
    let sx = this.scrollX;
    let sy = this.scrollY;
    if (left + sx < 0) sx = -left;
    else if (right + sx > this.view.w) sx = this.view.w - right;
    if (top + sy < 0) sy = -top;
    else if (bottom + sy > this.view.h) sy = this.view.h - bottom;
    this.pan(sx, sy, !instant);
  }

  /** Moves the tree to a pan offset, kept within its range; a tree that fits its window is centered across and sits at its top. */
  private pan(sx: number, sy: number, animate = false): void {
    const minX = Math.min(0, this.view.w - this.contentW);
    const minY = Math.min(0, this.view.h - this.contentH);
    sx = Phaser.Math.Clamp(sx, minX, 0);
    sy = Phaser.Math.Clamp(sy, minY, 0);
    this.tweens.killTweensOf(this);
    if (animate && (sx !== this.scrollX || sy !== this.scrollY)) {
      this.tweens.add({ targets: this, scrollX: sx, scrollY: sy, duration: 200, ease: 'Quad.easeOut', onUpdate: () => this.place() });
      return;
    }
    this.scrollX = sx;
    this.scrollY = sy;
    this.place();
  }

  private place(): void {
    const fitsX = this.contentW <= this.view.w;
    const fitsY = this.contentH <= this.view.h;
    this.world.x = this.view.x + (fitsX ? (this.view.w - this.contentW) / 2 : this.scrollX);
    this.world.y = this.view.y + (fitsY ? 0 : this.scrollY);
    const minX = Math.min(0, this.view.w - this.contentW);
    this.leftArrow.container.setVisible(!fitsX && this.scrollX < -1);
    this.rightArrow.container.setVisible(!fitsX && this.scrollX > minX + 1);
  }

  private onDown = (p: Phaser.Input.Pointer): void => {
    const at = pointerCss(p);
    this.moved = false;
    this.press = at.y >= this.view.y && at.y <= this.view.y + this.view.h ? { x: at.x, y: at.y, sx: this.scrollX, sy: this.scrollY } : undefined;
  };

  /** A press inside the tree's window drags it, once it has moved past the slop (a smaller move stays a tap). */
  private onMove = (p: Phaser.Input.Pointer): void => {
    if (!this.press || !p.isDown) return;
    const at = pointerCss(p);
    const dx = at.x - this.press.x;
    const dy = at.y - this.press.y;
    if (!this.moved && Math.hypot(dx, dy) < DRAG_SLOP) return;
    this.moved = true;
    this.pan(this.press.sx + dx, this.press.sy + dy);
  };

  private onUp = (): void => {
    this.press = undefined;
  };

  /** The wheel pans: down the tree when it's taller than its window, else across it. */
  private onWheel = (_p: Phaser.Input.Pointer, _over: unknown, dx: number, dy: number): void => {
    if (this.contentH > this.view.h) this.pan(this.scrollX - dx, this.scrollY - dy);
    else this.pan(this.scrollX - dx - dy, this.scrollY);
  };

  private buySelected(): void {
    const v = this.selected;
    if (!v || !this.buyable(v) || !this.buy(v.node)) return;
    this.profile = loadProfile(window.localStorage);
    getSfx(this)?.techBuy();
    const base = this.balanceIcon.scale;
    this.tweens.add({ targets: this.balanceText, scale: 1.15, duration: 75, yoyo: true, repeat: 1, ease: 'Quad.easeOut', onComplete: () => this.balanceText.setScale(1) });
    this.tweens.add({ targets: this.balanceIcon, scale: base * 1.15, duration: 75, yoyo: true, repeat: 1, ease: 'Quad.easeOut', onComplete: () => this.balanceIcon.setScale(base) });
    this.refresh();
    // A bought node hands the selection on to the first node it unlocked, so a chain buys down.
    const next = this.views.find((c) => c.parent === v);
    if (next) this.select(next);
  }

  private buy(node: RowNode): boolean {
    return node.branch === 'start' || node.branch === 'draft'
      ? buyNode(window.localStorage, node.id)
      : node.branch === 'pool'
        ? buyPoolNode(window.localStorage, node.id)
        : node.branch === 'claim'
          ? buyClaimNode(window.localStorage, node.id)
          : node.branch === 'wave'
            ? buyWaveNode(window.localStorage, node.id)
            : node.branch === 'tower'
              ? buyTowerNode(window.localStorage, node.id)
              : node.branch === 'exit'
                ? buyExitNode(window.localStorage, node.id)
                : node.branch === 'bank'
                  ? buyBankNode(window.localStorage, node.id)
                  : node.branch === 'kill'
                    ? buyKillNode(window.localStorage, node.id)
                    : buyBoardNode(window.localStorage, node.id);
  }
}
