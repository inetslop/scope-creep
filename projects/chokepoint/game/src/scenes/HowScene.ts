import Phaser from 'phaser';
import { PALETTE } from '../content/palette';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { makeCard } from '../ui/card';
import { uiCamera, viewSize } from '../ui/display';
import { textStyle, titleStyle } from '../ui/text';
import { onResize, SCENES } from './keys';

const W = 340; // card width
const PAD = 20; // side padding; the lines wrap at W - PAD * 2
const TOP = 36; // card top -> title center
const GAP_TL = 42; // title center -> first line top
const LINE_GAP = 12; // between the four lines
const GAP_LP = 20; // last line bottom -> pointer top
const BOTTOM = 26; // pointer bottom -> card bottom

/** The run's loop in four dry lines, then the pointer to the pause's keys. Static text checked
 * against the game's own data (SLOT_COSTS, REWARD_WAVE = 10, the Tech scene), never its own numbers. */
const LINES = [
  'Cards make the towers: the first card decides the attack, every one after changes it.',
  'Gold buys the slots, each one dearer — few strong towers or many simple ones.',
  'A leak costs a life; out of lives, the run ends.',
  'Coins pay from wave 10 on, and buy the tech between runs.',
];

/** The How card: the run's loop on demand. The menu sits dimmed behind; a tap on the dimmed
 * area — the row itself included — closes it back to the menu (the row's toggle). No sound,
 * no keyboard, nothing written to the profile. */
export class HowScene extends Phaser.Scene {
  private box?: Phaser.GameObjects.Container;
  private shade!: Phaser.GameObjects.Rectangle;
  private closed = false;

  constructor() {
    super(SCENES.how);
  }

  create(): void {
    uiCamera(this);
    hook.overlay = SCENES.how;
    this.closed = false;
    // The menu stays behind: the shade dims it, and a tap on the dimmed area closes the card.
    this.shade = this.add.rectangle(0, 0, 10, 10, PALETTE.ground, 0.78).setOrigin(0).setInteractive();
    this.shade.on('pointerdown', this.close);
    // Pass 1: measure the four lines at (0,0) with their final wrap width, then size the card.
    const lines = LINES.map((t) => this.add.text(0, 0, t, textStyle(15, PALETTE.ink, { wordWrap: { width: W - PAD * 2 } })));
    const pointer = this.add.text(0, 0, 'The keys are on the pause.', textStyle(14, PALETTE.muted));
    const linesH = lines.reduce((n, l) => n + l.height, 0) + LINE_GAP * (LINES.length - 1);
    const panelH = TOP + GAP_TL + linesH + GAP_LP + pointer.height + BOTTOM;
    const card = makeCard(this, 0, 0, W, panelH, 28);
    card.setInteractive(); // the card eats its own taps: only the shade (and the row in it) close
    const parts: Phaser.GameObjects.GameObject[] = [
      card,
      this.add.text(0, -panelH / 2 + TOP, 'How', titleStyle(32)).setOrigin(0.5),
    ];
    let y = -panelH / 2 + TOP + GAP_TL;
    for (const l of lines) {
      l.setPosition(-W / 2 + PAD, y);
      y += l.height + LINE_GAP;
    }
    pointer.setPosition(-W / 2 + PAD, y + GAP_LP - LINE_GAP);
    parts.push(...lines, pointer);
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
