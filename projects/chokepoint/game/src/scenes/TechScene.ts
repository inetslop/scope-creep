import Phaser from 'phaser';
import { artScale, COIN_TEXTURE } from '../art/textures';
import { cssColor, PALETTE } from '../content/palette';
import { loadProfile, type Profile } from '../core/profile';
import { buyNode, TECH_NODES, type TechNode } from '../core/tech';
import { hook } from '../debug/testHook';
import { makeButton, type Button } from '../ui/button';
import { makeCard } from '../ui/card';
import { uiCamera, viewSize } from '../ui/display';
import { textStyle, titleStyle } from '../ui/text';
import { getSfx, onResize, SCENES } from './keys';

/**
 * The tech tree: the coins runs earn become spendable here, on lasting run-start bonuses. For
 * now one branch ("Run start"); the menu sits dimmed behind, and a purchase is saved straight
 * into the profile (the coins are spent, not moved).
 */
interface TechCard {
  node: TechNode;
  button: Button;
  price: Phaser.GameObjects.Text;
  coin: Phaser.GameObjects.Image;
  border: Phaser.GameObjects.Graphics;
}

export class TechScene extends Phaser.Scene {
  private profile!: Profile;
  private kind: 'wide' | 'narrow' = 'narrow';
  private panelW = 0;
  private panelH = 0;
  private box?: Phaser.GameObjects.Container;
  private balanceText!: Phaser.GameObjects.Text;
  private balanceIcon!: Phaser.GameObjects.Image;
  private cards: TechCard[] = [];

  constructor() {
    super(SCENES.tech);
  }

  create(): void {
    uiCamera(this);
    hook.overlay = SCENES.tech;
    this.profile = loadProfile(window.localStorage);
    // The menu stays behind: the shade dims it, so this scene paints no background of its own,
    // and a tap on the dimmed area does nothing.
    const shade = this.add.rectangle(0, 0, 10, 10, PALETTE.ground, 0.78).setOrigin(0).setDepth(1).setInteractive();
    const size = viewSize(this);
    this.kind = size.width >= 740 ? 'wide' : 'narrow';
    this.rebuild();
    const layout = (width: number, height: number): void => {
      shade.setSize(width, height);
      shade.input?.hitArea.setTo(0, 0, width, height);
      const kind = width >= 740 ? 'wide' : 'narrow';
      if (kind !== this.kind) {
        this.kind = kind;
        this.rebuild();
      }
      this.box?.setPosition(width / 2, height / 2).setScale(Math.min(1, (width - 24) / this.panelW, (height - 24) / this.panelH));
    };
    layout(size.width, size.height);
    onResize(this, layout);
  }

  /** The card's content, built for one width class; a resize that flips the class rebuilds it. */
  private rebuild(): void {
    this.box?.destroy();
    this.cards = [];
    const wide = this.kind === 'wide';
    this.panelW = wide ? 716 : 356;
    this.panelH = wide ? 372 : 470;
    const panel = makeCard(this, 0, 0, this.panelW, this.panelH, 28);
    const title = this.add.text(0, -this.panelH / 2 + 52, 'Tech', titleStyle(32)).setOrigin(0.5);
    const number = this.add.text(0, -this.panelH / 2 + 96, String(this.profile.coins), textStyle(28, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
    const coin = artScale(this.add.image(0, -this.panelH / 2 + 96, COIN_TEXTURE), 1.4);
    this.balanceText = number;
    this.balanceIcon = coin;
    this.centerBalance();
    const label = this.add.text(0, -this.panelH / 2 + (wide ? 140 : 132), 'Run start', textStyle(14, PALETTE.muted)).setOrigin(0.5);
    const exit = (): void => {
      hook.overlay = '';
      this.scene.start(SCENES.menu);
    };
    const menuButton = makeButton(this, 0, this.panelH / 2 - 54, 'Menu', exit, { width: 240, height: 52, radius: 26 });
    const xs = wide ? [-258, -86, 86, 258] : [-86, -86, 86, 86];
    const ys = wide ? [27, 27, 27, 27] : [-30, -30, 82, 82];
    for (const [i, node] of TECH_NODES.entries()) {
      const button = makeButton(this, 0, 0, '', () => this.buy(node), { width: 160, height: 100, radius: 16, fadeWhenDisabled: false });
      const name = this.add.text(0, -32, node.name, textStyle(16, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
      const effect = this.add.text(0, -4, node.line, textStyle(13, PALETTE.muted, { align: 'center', wordWrap: { width: 140 }, lineSpacing: 2 })).setOrigin(0.5);
      const price = this.add.text(0, 34, '', textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
      const nodeCoin = artScale(this.add.image(0, 34, COIN_TEXTURE), 12 / 28);
      button.content.add([name, effect, price, nodeCoin]);
      const border = this.add.graphics();
      button.container.add(border); // a sibling of the content, so it never lifts with the card
      button.container.setPosition(xs[i], ys[i]);
      this.cards.push({ node, button, price, coin: nodeCoin, border });
    }
    const parts: Phaser.GameObjects.GameObject[] = [panel, title, coin, number, label];
    for (const c of this.cards) parts.push(c.button.container);
    parts.push(menuButton.container);
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

  /** Every node card: owned (yellow border), locked (needs the previous), or for sale (red price when unaffordable). */
  private refresh(): void {
    for (const c of this.cards) {
      const owned = this.profile.purchased.includes(c.node.id);
      const unlocked = c.node.requires === null || this.profile.purchased.includes(c.node.requires);
      const afford = this.profile.coins >= c.node.price;
      c.border.clear();
      if (owned) {
        c.border.lineStyle(2, PALETTE.yellow, 1);
        c.border.strokeRoundedRect(-81, -51, 162, 102, 17);
        c.price.setText('owned').setColor(cssColor(PALETTE.muted));
        c.price.x = -c.price.width / 2; // the price text is left-origin (the coin row); center it on its own
        c.coin.setVisible(false);
        c.button.content.setAlpha(1);
      } else if (!unlocked) {
        c.price.setText('needs the previous').setColor(cssColor(PALETTE.muted));
        c.price.x = -c.price.width / 2;
        c.coin.setVisible(false);
        c.button.content.setAlpha(0.5);
      } else {
        c.price.setText(String(c.node.price)).setColor(cssColor(afford ? PALETTE.ink : PALETTE.red));
        const w = 20 + c.price.width;
        c.coin.x = -w / 2 + 6;
        c.price.x = -w / 2 + 20;
        c.coin.setVisible(true);
        c.button.content.setAlpha(afford ? 1 : 0.6);
      }
      c.button.setEnabled(afford && unlocked && !owned);
    }
  }

  /** One tap on an affordable node: the balance drops and pops, the chime plays, the card turns owned. */
  private buy(node: TechNode): void {
    if (!buyNode(window.localStorage, node.id)) return;
    this.profile = loadProfile(window.localStorage);
    getSfx(this)?.techBuy();
    this.balanceText.setText(String(this.profile.coins));
    this.centerBalance();
    const base = this.balanceIcon.scale;
    this.tweens.add({ targets: this.balanceText, scale: 1.15, duration: 75, yoyo: true, repeat: 1, ease: 'Quad.easeOut', onComplete: () => this.balanceText.setScale(1) });
    this.tweens.add({ targets: this.balanceIcon, scale: base * 1.15, duration: 75, yoyo: true, repeat: 1, ease: 'Quad.easeOut', onComplete: () => this.balanceIcon.setScale(base) });
    this.refresh();
  }
}
