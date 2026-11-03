---
id: T0467
title: "The levels reference: a menu card that names every level"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-03T03:26:12Z
epic: E21
---

## Goal
The level pick on the run-setup step is a real choice only if the player knows what each level does. A "Levels" card on the menu lists every level with its effect and its coin multiplier, so the pick is readable from one place — and it completes the game's reference set (enemies, waves, bosses, coins, boards, how, the augments codex).

## Details
- A "Levels" button on the menu, in the How/Tech row (the How card's own pattern, T0351). Tapping it opens the card over the dimmed menu.
- The card is a white rounded card (the How card's look) that lists every run level, in the run-setup step's own order, read from the level data — so a new level (Plain, and any after it) names itself here with no change to this file.
- Each row, top to bottom: the level's name in bold ink, its dry one-liner (the run-setup step's own words, not new copy), and its coin multiplier (the run-setup step's own number, e.g. "coins ×1.25").
- The card is a reference only: it does not show the current pick (levels are picked per-run on the setup step, not remembered) and it changes nothing.
- A Back button returns to the menu (the How card's back pattern). If the set ever outgrows the card it scrolls the way the codex does (T0221).
- It fits: every line, with the longest name and the biggest multiplier number, fits its card at 412x915 and 1280x720.

## Acceptance criteria
- [ ] The menu has a "Levels" button in the How/Tech row; tapping it opens the card over the dimmed menu, and Back returns to the menu.
- [ ] The card lists every level with its name, one-liner and coin multiplier, read from the level data (a newly added level appears here with no change to this card).
- [ ] The card is a white rounded card in the How card's look; no other menu element moves or is shown twice.
- [ ] Every line fits at 412x915 and 1280x720.
- [ ] The button is discoverable where it is used and listed on the pause screen's controls (Pillar 8).

## Design (architect, desktop)

### Files
- create `src/scenes/LevelsScene.ts` — the Levels reference card (white rounded card, one row per level from `LEVEL_AUGMENTS`, back-to-menu/pause).
- edit `src/scenes/keys.ts` — add `levels: 'Levels',` to `SCENES` (next to `how`).
- edit `src/main.ts` — import `LevelsScene` and register it in the `scene` array after `HowScene`.
- edit `src/scenes/MenuScene.ts` — add the "Levels" button in the How/Tech column + its `fadeIn`/`below`/placement lines.
- edit `src/scenes/PauseScene.ts` — add the "Levels" controls line + pause button (the Pillar 8 / reference-set entry).

### Interfaces
- `class LevelsScene extends Phaser.Scene` with `create(data?: { from?: string }): void`. `data.from === SCENES.pause` (and pause actually paused) returns to the pause; otherwise returns to the menu. No new content/core types — reads `LEVEL_AUGMENTS` and `levelMultiplierLabel` (both already exist).

### Steps
1. `src/scenes/LevelsScene.ts` — new file, model on `CoinsScene` (build→measure→place, scale-to-fit layout, shade-tap + round-ink back button) with `CodexScene`'s `from`-data `doBack`. Full file:

```ts
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

  constructor() { super(SCENES.levels); }

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
```

2. `src/scenes/keys.ts` — in `SCENES`, add `levels: 'Levels',` on its own line right after `how: 'How',`.

3. `src/main.ts` — add `import { LevelsScene } from './scenes/LevelsScene';` after the `HowScene` import; in the `scene: [...]` array add `LevelsScene` after `HowScene` (i.e. `..., CodexScene, HowScene, LevelsScene, HistoryScene, ...`).

4. `src/scenes/MenuScene.ts` — four small additions:
   - After the `howRow` `makeButton`, define: `const levels = makeButton(this, 0, 0, 'Levels', () => { this.scene.launch(SCENES.levels); this.scene.pause(); }, { width: 220, height: 60, fontSize: 24, radius: 30 });`
   - In `fadeIn`, right after `fadeIn.push(howRow.container);` add `fadeIn.push(levels.container);`
   - In `layout`, after `below += GAP + BUTTON_H; // the How row` add `below += GAP + BUTTON_H; // the Levels row`
   - In `layout`, after the `howRow` placement (`howRow.container.setPosition(cx, put(BUTTON_H));`) and before `if (history)`, add: `gap(GAP); levels.container.setScale(s); levels.container.setPosition(cx, put(BUTTON_H));`

5. `src/scenes/PauseScene.ts` — four small additions (keep the Levels entry next to Boards, not at the very end):
   - In the `CONTROLS` array, after the `'Boards — ...'` line add: `'Levels — what each level does and its coin multiplier',`
   - After the `boardsButton` definition, before `showAugments`, add:
     `const showLevels = (): void => { if (closed) return; this.scene.launch(SCENES.levels, { from: SCENES.pause }); this.scene.pause(); }; const levelsButton = makeButton(this, 0, 0, 'Levels', showLevels, { width: 240, height: 52, radius: 26 });`
   - In the single `h += GAP_B + 56 + ... + PAD;` line, add one more `+ GAP_S + 52` term (one per the new button).
   - In the placement block, after `boardsButton.container.setY(cy(52)); y += GAP_S;` add `levelsButton.container.setY(cy(52)); y += GAP_S;`; and add `levelsButton.container` to the `boxKids` array right after `boardsButton.container`.

### Pitfalls
- Scene draw order: `LevelsScene` must sit after `PauseScene` and `MenuScene` in the `main.ts` array or it will draw under them. Placing it after `HowScene` is correct.
- The card is a separate overlay; the menu/pause stay paused behind it (launch + pause, back via `scene.start`). Do not `stop`/`destroy` the parent scene.
- Do not call `setInteractive()` on the card image — like `CoinsScene`, taps pass through the (non-interactive) box to the full-screen shade, which closes. The back button is the only separate hit target.
- Multiplier text must reuse `levelMultiplierLabel([def.id])` (the run-setup step's own number), not a hand-typed value or a new "coins ×…" string — that is what keeps it in sync with the setup step and T0452.
- Mobile fit: verify the menu (now one button taller) and the pause card (one 52px button taller) still fit at 412x915 — both use scale-to-fit, so they shrink; confirm the menu's 60px buttons stay ≥44px (scale stays >0.73). The Levels card itself is small (~460px tall for 6 rows, ~520 for 7) and fits at full size at both viewports.
- No `Math.random`, no `dt`, no pooling here (static scene) — but do clean up via the existing `onResize`/`onKey`-style `shutdown`-safe helpers only; this scene uses `onResize` only.
- Do not add a `Levels` entry to `tests/content.test.ts` or any content registry — it is UI only and reads existing data.

### Tests
none (UI scene reading existing `LEVEL_AUGMENTS` and `levelMultiplierLabel`; no new `src/core` rule).
