import Phaser from 'phaser';
import { artScale, augmentTexture } from '../art/textures';
import { AUGMENTS } from '../content/augments';
import { PALETTE } from '../content/palette';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { makeButton, type Button } from '../ui/button';
import { makeCard } from '../ui/card';
import { EDGE } from '../ui/hud/hud';
import { uiCamera, viewSize } from '../ui/display';
import { textStyle, titleStyle } from '../ui/text';
import { tierGemColor, tierName } from '../ui/tierLook';
import { getSfx, onResize, SCENES } from './keys';

/**
 * The Augments codex: every augment in the pool, in the pool's order, with both of its card
 * lines (the draft's own text). One white rounded card that grows with its rows and scales to
 * fit the screen; the menu sits dimmed behind. It reads the pool's data and owns no state —
 * a new scene re-reads the pool, so the 16-cap churn shows up on the next open.
 */
export class CodexScene extends Phaser.Scene {
  private kind: 'wide' | 'narrow' = 'narrow';
  private panelW = 0;
  private panelH = 0;
  private box?: Phaser.GameObjects.Container;
  private shade!: Phaser.GameObjects.Rectangle;
  private back!: Button;
  private closed = false;

  constructor() {
    super(SCENES.codex);
  }

  create(): void {
    uiCamera(this);
    hook.overlay = SCENES.codex;
    this.closed = false;
    // The menu stays behind: the shade dims it, and a tap on the dimmed area does nothing.
    this.shade = this.add.rectangle(0, 0, 10, 10, PALETTE.ground, 0.78).setOrigin(0).setInteractive();
    const doBack = (): void => {
      if (this.closed) return;
      this.closed = true;
      getSfx(this)?.blip();
      hook.overlay = '';
      this.scene.start(SCENES.menu);
    };
    // The back button: a round ink card with a white arrow, top right.
    this.back = makeButton(this, 0, 0, '', doBack, { width: 48, height: 48, radius: 24, fill: PALETTE.ink });
    const arrow = this.add.graphics();
    arrow.fillStyle(PALETTE.card, 1);
    arrow.fillTriangle(3, -7, 3, 7, -8, 0);
    this.back.content.add(arrow);
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
      // The whole card scales to fit, like the end card: no scroll, no clip.
      this.box!.setPosition(width / 2, height / 2).setScale(Math.min(1, (width - 24) / this.panelW, (height - 24) / this.panelH));
      this.back.container.setPosition(width - EDGE - 24, 40);
    };
    layout(size.width, size.height);
    onResize(this, layout);
    // A smoke tap on the menu can land on the new button; back out so the run is not stranded here.
    if (flags.smoke) this.time.delayedCall(800, doBack);
  }

  /** The card's content, built for one width class; a resize that flips the class rebuilds it.
   * Only the box is destroyed: the shade and back button live in create(). */
  private rebuild(): void {
    this.box?.destroy();
    this.build();
  }

  private build(): void {
    const g =
      this.kind === 'wide'
        ? { cols: 3, entryW: 200, colGap: 16, rowGap: 16, pad: 20, header: 92, bottom: 28 }
        : { cols: 2, entryW: 168, colGap: 12, rowGap: 12, pad: 16, header: 84, bottom: 24 };
    this.panelW = g.pad * 2 + g.cols * g.entryW + (g.cols - 1) * g.colGap;
    // Pass 1: lay the two lines out at (0,0) with their final wrap width to measure them, then
    // let each entry grow to fit its own rows (DraftScene's pattern).
    const entries: { h: number; tower: Phaser.GameObjects.Text; added: Phaser.GameObjects.Text }[] = [];
    for (const def of AUGMENTS) {
      const wrap = { wordWrap: { width: g.entryW - 32 } };
      const tower = this.add.text(0, 0, def.asTower, textStyle(14, PALETTE.ink, wrap));
      const added = this.add.text(0, 0, def.asAdded, textStyle(14, PALETTE.muted, wrap));
      entries.push({ h: 52 + tower.height + 6 + added.height + 16, tower, added });
    }
    const rowHeights: number[] = [];
    for (let r = 0; r * g.cols < entries.length; r++) {
      rowHeights.push(Math.max(...entries.slice(r * g.cols, (r + 1) * g.cols).map((e) => e.h)));
    }
    this.panelH = g.header + rowHeights.reduce((n, h) => n + h + g.rowGap, 0) - g.rowGap + g.bottom;
    const parts: Phaser.GameObjects.GameObject[] = [makeCard(this, 0, 0, this.panelW, this.panelH, 28)];
    parts.push(this.add.text(0, -this.panelH / 2 + 52, 'Augments', titleStyle(32)).setOrigin(0.5));
    entries.forEach((entry, i) => {
      const r = Math.floor(i / g.cols);
      const c = i % g.cols;
      const x = -this.panelW / 2 + g.pad + g.entryW / 2 + c * (g.entryW + g.colGap);
      const rowTop = rowHeights.slice(0, r).reduce((n, h) => n + h + g.rowGap, 0);
      const y = -this.panelH / 2 + g.header + rowTop + rowHeights[r] / 2;
      const lx = x - g.entryW / 2; // the entry's top-left corner
      const ty = y - entry.h / 2;
      const def = AUGMENTS[i];
      parts.push(makeCard(this, x, y, g.entryW, entry.h, 14));
      parts.push(artScale(this.add.image(lx + 26, ty + 30, augmentTexture(def.id)), 1.3));
      const name = this.add.text(lx + 48, ty + 30, def.name, titleStyle(18)).setOrigin(0, 0.5);
      parts.push(name);
      if (def.tier === 'epic') {
        // Epic-only augments say so in the tier word's color; every other entry keeps its plain name.
        parts.push(this.add.text(name.x + name.width, ty + 30, ` · ${tierName('epic')}`, titleStyle(13, tierGemColor('epic'))).setOrigin(0, 0.5));
      }
      const towerLine = entry.tower;
      const addedLine = entry.added;
      towerLine.setPosition(lx + 16, ty + 52);
      addedLine.setPosition(lx + 16, towerLine.y + towerLine.height + 6);
      parts.push(towerLine, addedLine);
    });
    this.box = this.add.container(0, 0, parts);
  }
}
