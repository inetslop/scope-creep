---
id: T0351
title: "How to play: the menu card that re-teaches the run's loop"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-01T09:37:42Z
---

## Goal
The first-run hints (T0318, T0319, T0320) teach the run's loop once and never return, and no screen explains the loop afterwards — the codex shows the augments, the references show the enemies, waves, coins, bosses and boards, but "what is this run about" has nowhere to be looked up. A How card on the menu re-teaches the loop on demand, in the game's own words.

## Details
- A new menu row in the start screen's column (the menu row's look, one word, e.g. "How") that opens a menu-adjacent overlay in the CodexScene/TechScene pattern: the menu dims, one white rounded card. The row joins the start screen's fit-sum (T0222) so the menu still fits without scrolling at 412x915 and 1280x720. The row earns its place: the column already grew a row per new option (Iron, T0241) and still fits, and the loop it opens is the one thing no screen explains after the first run.
- The card is the run's loop in four dry lines (one line each, the game's own voice), with no number the game doesn't have:
  1. "Cards make the towers: the first card decides the attack, every one after changes it."
  2. "Gold buys the slots, each one dearer — few strong towers or many simple ones."
  3. "A leak costs a life; out of lives, the run ends."
  4. "Coins pay from wave 10 on, and buy the tech between runs."
- Under the four lines, one muted pointer line: "The keys are on the pause." The controls stay listed on the pause screen; nothing is repeated here, and the pause screen is not touched.
- The row toggles the overlay (the codex's own open/close: tap the shade or the row again to close); the overlay takes no other input, plays no sound, and writes nothing to the profile.
- No new numbers, no new state: the lines are static content in the new scene file, checked against the game's own data (the wave-10 pay rule, the slot prices, the tech spend) so the card never states what the game doesn't do.

## Acceptance criteria
- [ ] The start screen shows the new row in the menu row's look, and the menu still fits without scrolling at 412x915 and 1280x720 (the smoke test's layout check).
- [ ] Tapping the row opens the dimmed overlay with the white card: the four loop lines and the muted "The keys are on the pause." line; tapping the shade or the row again closes it back to the menu.
- [ ] The four lines state the loop's rules (the cards make the towers, the first card deciding the attack; the gold buys the slots, each dearer; a leak costs a life; coins pay from wave 10 on and buy the tech) and state no number or rule the game doesn't have.
- [ ] Nothing else changes: the pause screen and its controls list, the codex, the references, the menu demo and the profile card are untouched; no sound, no new input, nothing written to the profile.

## Design (architect, desktop)

### Files
- create `src/scenes/HowScene.ts` — the "How" overlay: dimmed shade over the menu + one white card with the four loop lines and the muted pointer line; tap shade (or the dimmed row) to close.
- edit `src/scenes/keys.ts` — add `how: 'How',` to `SCENES` on its own line right after `codex: 'Codex',` (line 13).
- edit `src/main.ts` — add `import { HowScene } from './scenes/HowScene';` in the import block between `HudScene` and `MenuScene` (alphabetical); add `HowScene,` right after `CodexScene,` in the scene array (line 57).
- edit `src/scenes/MenuScene.ts` — the "How" row: 4 small insertions below (a) button, (b) fadeIn list, (c) fit-sum, (d) layout placement.

### Interfaces
No new types. `HowScene extends Phaser.Scene` with `create()` and a private `close = () => void` (arrow field, so it can be a listener). No changes to `core/`, `ui/`, or the profile.

### Steps
1. `src/scenes/keys.ts`: add `how: 'How',` after the `codex` line.
2. `src/scenes/HowScene.ts` — transcribe this file (modeled on `CodexScene.ts`, minus the kind/rebuild and back button; content is static, built once):
```ts
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
```
3. `src/main.ts`: import + array line as in Files.
4. `src/scenes/MenuScene.ts` — four insertions, all next to the `augments` row:
   - After the `augments` button (line 126):
```ts
const howRow = makeButton(this, 0, 0, 'How', () => {
  this.scene.launch(SCENES.how);
  this.scene.pause();
}, { width: 220, height: 60, fontSize: 24, radius: 30 });
```
   - In the fadeIn list, after `fadeIn.push(augments.container);`: `fadeIn.push(howRow.container);`
   - In the fit-sum, after line 170 (`below += BUTTON_H + GAP + IRON_H + ... + BUTTON_H;` which ends with the Augments row) and before `if (boards)`: `below += GAP + BUTTON_H; // the How row`
   - In `layout()`, after the `augments.container...setPosition(cx, put(BUTTON_H));` block (line 226) and before `if (boards) {`:
```ts
gap(GAP);
howRow.container.setScale(s);
howRow.container.setPosition(cx, put(BUTTON_H));
```

### Pitfalls
- **Name clash**: MenuScene already has a `how` text (the tagline, line 74). The new button must be `howRow`.
- **Toggling works via the shade, not the row**: while HowScene runs the menu is paused, so the row itself never receives taps. The shade covers the row's position and closes on any tap, which is exactly "tap the row again to close" — do not add cross-scene hit-testing.
- **The card must absorb taps**: `card.setInteractive()` with no handler (TechScene's pattern); without it, card taps would close the card.
- **Close guard**: the `closed` flag prevents a double `scene.start` (double tap, or the smoke delayedCall firing twice).
- **No keyboard handler** in HowScene: the task says the overlay takes no other input; the paused menu's Enter/Space handler does not fire under an overlay (Phaser paused scenes get no input).
- **No sound, no profile write**: do not call `getSfx` or `loadProfile`/storage in HowScene, unlike Codex/Tech.
- **Menu fit**: the row earns its place in the fit-sum (step 4c); the column auto-scales (`s`) when it grows, so there is never scrolling at 412x915 or 1280x720. Card scales whole via `Math.min(1, (width-24)/W, (height-24)/panelH)` — never clip or scroll.

### Tests
none (UI-only task; the four lines are static text verified against `SLOT_COSTS` in `src/config.ts:20`, `REWARD_WAVE` in `src/core/levels.ts:7`, and the Tech scene).
