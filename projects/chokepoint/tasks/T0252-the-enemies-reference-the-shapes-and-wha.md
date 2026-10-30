---
id: T0252
title: "The enemies reference: the shapes and what they do, off the pause"
assignee: inet-racing
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-30T02:57:28Z
claimed_at: 2026-10-30T03:24:08Z
finished_at: 2026-10-30T04:19:51Z
---

## Goal
A reference for the shapes at any pause: one screen that shows every enemy with its token, name, description and the wave it comes from — the shape that just got through is readable at the next pause, and a first-time player can learn the road's occupants before the run does it for them. Groundwork for E5's bosses: the screen reads the enemy content, so a boss added later shows up here with no change to it.

## Details
- The pause card gains one new "Enemies" button: the same white 240-wide button as Resume/Quit/Sound (T0245's column), its own row after the Sound row; the card's height comes from its content as T0245 built it, so it still fits.
- Tapping it opens a new screen — a new scene file in the codex's pattern (T0221): the dim shade, one white rounded card, a bold "Enemies" title, and a "Back" button that returns to the pause card. The run stays paused while it is open.
- One row per enemy in the game's enemy content, in fromWave order: the enemy's on-board token at ~2x the wave preview's size (~32 px), its name in bold ink, its description (the content's own line, verbatim) in muted ink, and a muted "wave N" for its fromWave. The one that never walks in on its own (the Splinter) reads "from a Splitter" instead of a wave.
- The screen is data-driven off the enemy content: a new enemy added later (including E5's boss) shows up with no change to this screen.
- The pause's controls list (T0245's CONTROLS list) gains its line: "Enemies — the shapes and what they do".
- No gameplay change: nothing the screen shows is ever written back; the screen is read-only over the content.

## Acceptance criteria
- [ ] The pause card shows the "Enemies" button in the other buttons' style, the card still fits its content, and the controls list names the button.
- [ ] It opens the white card over the dimmed pause with the "Enemies" title, the rows as specified, and a "Back" button that returns to the pause card with the run still paused.
- [ ] One row per enemy in the content, in fromWave order, each with the token (~32 px), the bold name, the content's description and "wave N" (the split-piece's row reads "from a Splitter").
- [ ] The card fits without scrolling or overlapping text at 412x915 and 1280x720.
- [ ] A normal run is byte-identical: no new HUD element, no board mark, no new input, no change to waves, gold or resume.

## Design (architect, inet-racing)

### Files
- create `src/scenes/EnemiesScene.ts` — the reference screen (full code below)
- edit `src/scenes/keys.ts` — add `enemies: 'Enemies',` to `SCENES` directly after the `pause: 'Pause',` line
- edit `src/main.ts` — add `import { EnemiesScene } from './scenes/EnemiesScene';` after the DraftScene import; add `EnemiesScene` to the `scene:` array directly after `PauseScene,` (so it draws over the pause)
- edit `src/scenes/PauseScene.ts` — one CONTROLS line, one new button row, its height/placement lines, and an active-scene guard on `resume`/`quit`

### Interfaces
No new types. New scene: `export class EnemiesScene extends Phaser.Scene` with `create()`. Everything it reads already exists: `ENEMIES` (`src/content/enemies/index.ts`), `EnemyDef.{name, description, fromWave, spawnOnly, look.size}`, `enemyTexture(id)`, `artScale`, `CELL` (`src/config.ts`).

### Steps
1. `src/scenes/keys.ts`: insert `enemies: 'Enemies',` after `pause: 'Pause',`.
2. `src/main.ts`: the import (alphabetical, after `DraftScene`) and the array entry right after `PauseScene`.
3. `src/scenes/PauseScene.ts`:
   - `CONTROLS`: append `'Enemies — the shapes and what they do',` after the `'+ / - — zoom the board'` line.
   - In `create()`, guard both existing closures so the pause card's keys/timer can't act while paused under the reference: `if (closed || !this.scene.isActive()) return;` as the first line of `resume` and `quit`.
   - After the `refreshRow();` line (the sound row's), add:
     ```ts
     const showEnemies = (): void => {
       if (closed) return;
       this.scene.launch(SCENES.enemies);
       this.scene.pause(); // the pause card's Escape key must not fire under the reference
     };
     const enemiesButton = makeButton(this, 0, 0, 'Enemies', showEnemies, { width: 240, height: 52, radius: 26 });
     ```
   - Height line 164 becomes: `h += GAP_B + 56 + GAP_S + 52 + GAP_S + 52 + GAP_S + 52 + PAD;`
   - After `soundRow.container.setY(cy(52));` add `y += GAP_S;` then `enemiesButton.container.setY(cy(52));`
   - `boxKids`: append `enemiesButton.container` after `soundRow.container`.
4. Create `src/scenes/EnemiesScene.ts` — exact code:
   ```ts
   import Phaser from 'phaser';
   import { artScale, enemyTexture } from '../art/textures';
   import { CELL } from '../config';
   import { ENEMIES } from '../content/enemies';
   import { PALETTE } from '../content/palette';
   import { flags } from '../debug/flags';
   import { hook } from '../debug/testHook';
   import { makeButton, type Button } from '../ui/button';
   import { makeCard } from '../ui/card';
   import { EDGE } from '../ui/hud/hud';
   import { uiCamera, viewSize } from '../ui/display';
   import { textStyle, titleStyle } from '../ui/text';
   import { getSfx, onResize, SCENES } from './keys';

   /**
    * The enemies reference: every enemy in the content, in fromWave order, with its on-board
    * token, name, the content's own description, and the wave it comes from (a spawn-only
    * piece reads "from a Splitter"). One white rounded card that scales to fit the screen;
    * the pause sits dimmed behind. It reads the content and owns no state — an enemy added
    * later (a boss) shows up on the next open with no change to this scene.
    */
   export class EnemiesScene extends Phaser.Scene {
     private panelW = 340;
     private panelH = 0;
     private box!: Phaser.GameObjects.Container;
     private shade!: Phaser.GameObjects.Rectangle;
     private back!: Button;
     private closed = false;

     constructor() {
       super(SCENES.enemies);
     }

     create(): void {
       uiCamera(this);
       hook.overlay = SCENES.enemies;
       this.closed = false;
       // The pause stays behind: the shade dims it, and a tap on the dimmed area does nothing.
       this.shade = this.add.rectangle(0, 0, 10, 10, PALETTE.ground, 0.78).setOrigin(0).setInteractive();
       const doBack = (): void => {
         if (this.closed) return;
         this.closed = true;
         getSfx(this)?.blip();
         hook.overlay = SCENES.pause;
         this.scene.start(SCENES.pause); // the run stays paused: GameScene is paused, not the pause card
       };
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
         // The whole card scales to fit, like the codex: no scroll, no clip.
         this.box.setPosition(width / 2, height / 2).setScale(Math.min(1, (width - 24) / this.panelW, (height - 24) / this.panelH));
         this.back.container.setPosition(width - EDGE - 24, 40);
       };
       const size = viewSize(this);
       layout(size.width, size.height);
       onResize(this, layout);
       // A smoke tap on the pause can land on the new button; back out so the run is not stranded here.
       if (flags.smoke) this.time.delayedCall(1000, doBack);
     }

     private build(): void {
       const PAD = 16, TOKEN = 36, GAP_T = 12, GAP_R = 12, HEADER = 64, BOTTOM = 20, ROW_GAP = 10, MIN_ROW = 40;
       const innerW = this.panelW - PAD * 2;
       const textW = innerW - TOKEN - GAP_T;
       const defs = [...ENEMIES].sort((a, b) => a.fromWave - b.fromWave); // stable: ties keep the registry order
       // Pass 1: lay each row's texts out at (0,0) with their final wrap width to measure them.
       const rows = defs.map((def) => {
         const name = this.add.text(0, 0, def.name, titleStyle(14)).setOrigin(0, 0.5);
         const wave = this.add.text(0, 0, def.spawnOnly ? 'from a Splitter' : `wave ${def.fromWave}`, textStyle(12, PALETTE.muted)).setOrigin(1, 0.5);
         const desc = this.add.text(0, 0, def.description, textStyle(12, PALETTE.muted, { wordWrap: { width: textW } }));
         return { def, name, wave, desc, h: Math.max(MIN_ROW, name.height + 3 + desc.height) };
       });
       this.panelH = HEADER + rows.reduce((n, r) => n + r.h + ROW_GAP, 0) - ROW_GAP + BOTTOM;
       const parts: Phaser.GameObjects.GameObject[] = [makeCard(this, 0, 0, this.panelW, this.panelH, 28)];
       parts.push(this.add.text(0, -this.panelH / 2 + 42, 'Enemies', titleStyle(28)).setOrigin(0.5));
       const textX = -this.panelW / 2 + PAD + TOKEN + GAP_T;
       let rowTop = -this.panelH / 2 + HEADER;
       for (const row of rows) {
         const top = rowTop + (row.h - (row.name.height + 3 + row.desc.height)) / 2; // center the text block in its row
         // 2x the wave preview's 16 px icon: the token's radius is 16 px (~32 px), like NextWavePreview's scale doubled
         parts.push(artScale(this.add.image(-this.panelW / 2 + PAD + TOKEN / 2, rowTop + row.h / 2, enemyTexture(row.def.id)), 16 / (row.def.look.size * CELL)));
         row.name.setPosition(textX, top + row.name.height / 2);
         row.wave.setPosition(-this.panelW / 2 + innerW - GAP_R, top + row.name.height / 2);
         row.desc.setPosition(textX, top + row.name.height + 3);
         parts.push(row.name, row.wave, row.desc);
         rowTop += row.h + ROW_GAP;
       }
       this.box = this.add.container(0, 0, parts);
     }
   }
   ```

### Pitfalls
- **Escape double-fire**: `PauseScene`'s `onKey` Escape handler and its smoke timer keep existing while the reference is open. Launching the enemies scene with `this.scene.pause()` plus the `isActive()` guards on `resume`/`quit` makes both inert; `doBack` uses `scene.start(SCENES.pause)` which re-creates the pause card fresh (its guards then pass again).
- **Draw order**: `EnemiesScene` must come after `PauseScene` in `main.ts`'s array or the card renders under the pause's shade.
- **Never rotate/scale bare**: tokens go through `artScale()` only; the texture already carries the shadow room (`tokenRoom`), so no extra padding needed.
- **Layout is measured, not guessed**: row y's come from the accumulated `rowTop`, card height from the summed rows — the fullest state (11 rows, 3-line Hauler/Mute descriptions) is ~770 px tall and fits both 412x915 (scale 1) and 1280x720 (scale ~0.9) via the same `Math.min(1, …)` scale as the codex; a future boss just adds a row.
- **Stable sort**: `Array.prototype.sort` is stable, so fromWave ties (Splitter 9 / Splinter 9) keep the `ENEMIES` registry order — Splitter before Splinter.

### Tests
- none (UI-only; no core rule added)

## Result (attempt 1, inet-racing)

Added an "Enemies" button to the pause card (its own row, with a matching line in the controls list) that opens a new EnemiesScene — a dimmed-pause reference screen listing every enemy in fromWave order with its on-board token, name, content description and wave (the Splinter reads "from a Splitter"). The scene is data-driven off the enemy content, so future enemies (E5's bosses) appear with no changes; it has a Back button that returns to the pause card with the run still paused, and Escape/timer double-fire from the pause is guarded out. Verified with typecheck+lint+tests and the desktop/mobile smoke run, both passing.

- Self-review: APPROVE
- Time: 55.7 min

```
projects/chokepoint/game/src/main.ts               |  3 +-
 .../chokepoint/game/src/scenes/EnemiesScene.ts     | 97 ++++++++++++++++++++++
 projects/chokepoint/game/src/scenes/PauseScene.ts  | 17 +++-
 projects/chokepoint/game/src/scenes/keys.ts        |  1 +
 4 files changed, 113 insertions(+), 5 deletions(-)
```
