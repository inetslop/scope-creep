import Phaser from 'phaser';
import { artScale, STAR_TEXTURE } from '../art/textures';
import { PALETTE } from '../content/palette';
import { loadProfile } from '../core/profile';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { makeCard } from '../ui/card';
import { uiCamera, viewSize } from '../ui/display';
import { textStyle, titleStyle } from '../ui/text';
import { onResize, SCENES } from './keys';

const W = 340; // card width
const PAD = 20; // side padding; the rows sit at W - PAD * 2
const TOP = 36; // card top -> title center
const GAP_TL = 42; // title center -> first row top
const LINE_H = 20; // per row
const BOTTOM = 22; // last row bottom -> card bottom

/**
 * The History card: the last twelve finished runs, most recent first, one row each
 * ("Wave N · +X coins" in the recent line's own muted style). An Iron run wears the muted
 * "Iron" mark; a run at the saved best wave wears the small yellow star, several rows may.
 * The rows read the stored entries, never recompute. The menu sits dimmed behind; a tap on
 * the dimmed area closes it back to the menu, the How card's own way.
 */
export class HistoryScene extends Phaser.Scene {
  private box?: Phaser.GameObjects.Container;
  private shade!: Phaser.GameObjects.Rectangle;
  private closed = false;

  constructor() {
    super(SCENES.history);
  }

  create(): void {
    uiCamera(this);
    hook.overlay = SCENES.history;
    this.closed = false;
    // The menu stays behind: the shade dims it, and a tap on the dimmed area closes the card.
    this.shade = this.add.rectangle(0, 0, 10, 10, PALETTE.ground, 0.78).setOrigin(0).setInteractive();
    this.shade.on('pointerdown', this.close);
    const p = loadProfile(window.localStorage);
    const rows = p.recent;
    const style = textStyle(12, PALETTE.muted); // the recent line's own style
    const panelH = TOP + GAP_TL + rows.length * LINE_H + BOTTOM;
    const card = makeCard(this, 0, 0, W, panelH, 28);
    card.setInteractive(); // the card eats its own taps: only the shade closes
    const parts: Phaser.GameObjects.GameObject[] = [
      card,
      this.add.text(0, -panelH / 2 + TOP, 'History', titleStyle(32)).setOrigin(0.5),
    ];
    let y = -panelH / 2 + TOP + GAP_TL;
    for (const r of rows) {
      const line = this.add.text(-W / 2 + PAD, y, `Wave ${r.wave} · +${r.coins} coins`, style);
      parts.push(line);
      let x = -W / 2 + PAD + line.width; // the mark slot, its own for the storm when it lands (T0403)
      if (r.mode === 'iron') {
        const mark = this.add.text(x + 8, y, 'Iron', textStyle(12, PALETTE.muted, { fontStyle: 'bold' })); // the claim card's iron tag
        parts.push(mark);
        x += mark.width;
      }
      if (r.wave === p.bestWave) {
        parts.push(artScale(this.add.image(x + 13, y + line.height / 2 + 1, STAR_TEXTURE))); // the recent line's star rule
      }
      y += LINE_H;
    }
    this.box = this.add.container(0, 0, parts).setDepth(2);
    const size = viewSize(this);
    const layout = (width: number, height: number): void => {
      this.shade.setSize(width, height);
      this.shade.input?.hitArea.setTo(0, 0, width, height);
      this.box!.setPosition(width / 2, height / 2).setScale(Math.min(1, (width - 24) / W, (height - 24) / panelH));
    };
    layout(size.width, size.height);
    onResize(this, layout);
    // A smoke tap on the menu can land on the new row; close out so the run is not stranded here.
    if (flags.smoke) this.time.delayedCall(800, this.close);
  }

  /** Close back to the menu (it restarts, so the row is fresh and can re-open the card). */
  private close = (): void => {
    if (this.closed) return;
    this.closed = true;
    hook.overlay = '';
    this.scene.start(SCENES.menu);
  };
}
