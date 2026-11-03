import Phaser from 'phaser';
import { LEVEL_AUGMENTS } from '../content/levels';
import { PALETTE } from '../content/palette';
import { levelMultiplierLabel } from '../core/levels';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { makeButton, type Button } from '../ui/button';
import { makeCard } from '../ui/card';
import { EDGE } from '../ui/hud/hud';
import { uiCamera, viewSize } from '../ui/display';
import { textStyle, titleStyle } from '../ui/text';
import { getSfx, onResize, SCENES } from './keys';

const W = 340;           // card width (the How card's)
const PAD = 24;          // card top/bottom and side padding
const INNER = W - PAD * 2; // the one-liners wrap here
const GAP_TITLE = 16;    // title bottom -> first row
const GAP_LINE = 3;      // within a row: name -> line -> multiplier
const GAP_ROW = 14;      // between two rows

/** The levels reference: every level (content/levels) in the data's order, its name, its own
 * one-liner and the coins a run pays with it — read from the level data, so a new level names
 * itself here with no change to this file. A white rounded card over the dimmed menu (or pause);
 * it owns no state, shows no pick and changes nothing. */
export class LevelsScene extends Phaser.Scene {
  private panelW = W;
  private panelH = 0;
  private box!: Phaser.GameObjects.Container;
  private shade!: Phaser.GameObjects.Rectangle;
  private back!: Button;
  private closed = false;

  constructor() {
    super(SCENES.levels);
  }

  create(data?: { from?: string }): void {
    uiCamera(this);
    hook.overlay = SCENES.levels;
    this.closed = false;
    // The menu (or the pause) stays behind: the shade dims it and a tap on it closes the card.
    this.shade = this.add.rectangle(0, 0, 10, 10, PALETTE.ground, 0.78).setOrigin(0).setInteractive();
    const doBack = (): void => {
      if (this.closed) return;
      this.closed = true;
      getSfx(this)?.blip();
      // From the pause's Levels row: back to the pause (the run stays paused — GameScene is
      // paused, not the pause card). The menu opens with no data, so a stale pause data must not
      // send a menu open back to a stopped run.
      if (data?.from === SCENES.pause && this.scene.isPaused(SCENES.pause)) {
        hook.overlay = SCENES.pause;
        this.scene.start(SCENES.pause);
      } else {
        hook.overlay = '';
        this.scene.start(SCENES.menu);
      }
    };
    this.shade.on('pointerdown', doBack);
    // The back button: a round ink card with a white arrow, top right (the codex's).
    this.back = makeButton(this, 0, 0, '', doBack, { width: 48, height: 48, radius: 24, fill: PALETTE.ink });
    const arrow = this.add.graphics();
    arrow.fillStyle(PALETTE.card, 1);
    arrow.fillTriangle(3, -7, 3, 7, -8, 0);
    this.back.content.add(arrow);
    this.build();
    const layout = (width: number, height: number): void => {
      this.shade.setSize(width, height);
      this.shade.input?.hitArea.setTo(0, 0, width, height);
      // The whole card scales to fit, like the references: no scroll, no clip.
      this.box.setPosition(width / 2, height / 2).setScale(Math.min(1, (width - 24) / this.panelW, (height - 24) / this.panelH));
      this.back.container.setPosition(width - EDGE - 24, 40);
    };
    const size = viewSize(this);
    layout(size.width, size.height);
    onResize(this, layout);
    if (flags.smoke) this.time.delayedCall(800, doBack); // a smoke open must not strand the run here
  }

  private build(): void {
    const title = this.add.text(0, 0, 'Levels', titleStyle(32)).setOrigin(0.5);
    // Pass 1: lay each row's three pieces out at (0,0) with their final wrap width to measure.
    const rows: { name: Phaser.GameObjects.Text; line: Phaser.GameObjects.Text; mult: Phaser.GameObjects.Text }[] = [];
    for (const def of LEVEL_AUGMENTS) {
      const name = this.add.text(0, 0, def.name, textStyle(14, PALETTE.ink, { fontStyle: 'bold' }));
      const line = this.add.text(0, 0, def.line, textStyle(13, PALETTE.muted, { wordWrap: { width: INNER }, lineSpacing: 2 }));
      const mult = this.add.text(0, 0, levelMultiplierLabel([def.id]), textStyle(15, PALETTE.ink, { fontStyle: 'bold' }));
      rows.push({ name, line, mult });
    }
    // The card grows to its content, top-down: title, then one row per level.
    let h = PAD + title.height + GAP_TITLE;
    for (const r of rows) h += r.name.height + GAP_LINE + r.line.height + GAP_LINE + r.mult.height + GAP_ROW;
    h -= GAP_ROW; // no gap after the last row
    h += PAD;
    this.panelH = Math.ceil(h);
    const parts: Phaser.GameObjects.GameObject[] = [makeCard(this, 0, 0, this.panelW, this.panelH, 28), title];
    let y = -this.panelH / 2 + PAD;
    title.setY(y + title.height / 2);
    y += title.height + GAP_TITLE;
    for (const r of rows) {
      r.name.setPosition(-this.panelW / 2 + PAD, y); y += r.name.height + GAP_LINE;
      r.line.setPosition(-this.panelW / 2 + PAD, y); y += r.line.height + GAP_LINE;
      r.mult.setPosition(-this.panelW / 2 + PAD, y); y += r.mult.height + GAP_ROW;
      parts.push(r.name, r.line, r.mult);
    }
    this.box = this.add.container(0, 0, parts);
  }
}
