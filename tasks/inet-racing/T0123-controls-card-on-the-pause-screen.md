---
id: T0123
title: Controls card on the pause screen
assignee: inet-racing
size: S
priority: 1
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-27T15:27:21Z
claimed_at: 2026-10-27T17:58:16Z
---

## Goal
Nothing in the game tells the player that M mutes, P pauses or 1/2/3 pick a level-up card. The pause screen gets a small "CONTROLS" card that lists every input for the device the player is using, so the controls are always one pause away.

## Details
- One card on the pause screen, titled "CONTROLS" in small caps, drawn in the same ink type and size as The Index column's header and lines (T0104), with a thin ink rule under the title. Flat Bauhaus style: ink text on the paper, no box glow, no gradients.
- It lists the inputs for the device the game last saw input from (the `device` the input layer already tracks: keyboard, gamepad or touch), one line each, key first and action second:
  - Keyboard and mouse: "WASD / Arrows — move", "Mouse — aim", "Hold left click — fire", "Esc / P — pause", "M — mute", "1 / 2 / 3 — pick a card".
  - Gamepad: "Left stick — move", "Right stick — aim and fire", "R2 — fire".
  - Touch: "Left thumb — move", "Right thumb — aim and fire", "II button — pause".
- Layout:
  - Landscape (width 760 and up, the breakpoint The Index and the level-up cards use): 200 wide, mirroring The Index. It sits 28 px left of the centered buttons, top-aligned with The Index.
  - Portrait (412x915): between the PAUSED title and the Resume button. If it does not fit, move the title up (no higher than 18% of the height) rather than shrinking the text below The Index's size.
  - It must not overlap the title, the buttons or The Index at 1280x720 or 412x915. It does not take input, so the buttons keep working.
- Only `src/scenes/PauseScene.ts` changes. Other machines are editing GameScene, HudScene and MenuScene right now, so the menu hint is left for a follow-up task.

## Acceptance criteria
- [ ] Pausing after playing with keyboard and mouse shows the six keyboard lines; after touch input it shows the three touch lines; after gamepad input it shows the three gamepad lines.
- [ ] At 1280x720 the card sits left of the buttons, mirroring The Index on the right; at 412x915 it sits between the title and Resume; nothing overlaps in either.
- [ ] Resume, Quit to menu, Esc and P still work, and The Index is unchanged.
- [ ] The diff touches only `src/scenes/PauseScene.ts` (plus a unit test, if the architect adds a pure helper in `src/core/`).

## Design (architect, yoga)

### Files
- edit `src/scenes/PauseScene.ts` - the CONTROLS card (device-specific lines, thin rule, portrait title move); `buildPicksColumn` now returns its `colTop`

### Interfaces
None exported. Everything stays inside `PauseScene.ts`.

### Steps
1. Imports: add `import type { InputDevice } from '../input/Controls';` and add `getControls` to the existing `./keys` import.
2. After the imports (one entry per line, copy the strings exactly — em-dash `—` U+2014):
`const CONTROLS_BY_DEVICE: Record<InputDevice, string[]> = {`
keyboard: `'WASD / Arrows — move'`, `'Mouse — aim'`, `'Hold left click — fire'`, `'Esc / P — pause'`, `'M — mute'`, `'1 / 2 / 3 — pick a card'`
gamepad: `'Left stick — move'`, `'Right stick — aim and fire'`, `'R2 — fire'`
touch: `'Left thumb — move'`, `'Right thumb — aim and fire'`, `'II button — pause'`
3. `create()`: capture the title — `const title = this.add.text(width / 2, height * 0.3, 'PAUSED', titleStyle(Math.min(60, width * 0.12), PALETTE.ink, PALETTE.blue)).setOrigin(0.5);` (same args as today). Replace `this.buildPicksColumn(width, height);` with `const picksColTop = this.buildPicksColumn(width, height); this.buildControlsCard(title, width, height, picksColTop);`
4. `buildPicksColumn`: signature becomes `): number {`; the empty-state early `return;` becomes `return colTop;`; add `return colTop;` at the end of the method.
5. New method, verbatim:
```ts
/** CONTROLS card: every input for the device last used, in The Index's ink type. */
private buildControlsCard(title: Phaser.GameObjects.Text, width: number, height: number, picksColTop: number): void {
  const lines = CONTROLS_BY_DEVICE[getControls(this)?.device ?? 'keyboard'];
  const COL_W = 200, HEADER_H = 16, HEADER_GAP = 8, ROW_H = 18, MARGIN = 12;
  const colH = HEADER_H + HEADER_GAP + ROW_H * lines.length;
  const horizontal = width >= 760;
  const centerX = horizontal ? width / 2 - 110 - 28 - COL_W / 2 : width / 2; // landscape: mirror of The Index
  let colTop = picksColTop; // landscape: top-aligned with The Index
  if (!horizontal) {
    const resumeTop = height * 0.52 - 26; // top edge of the 52 px Resume button
    colTop = Math.min(title.y + title.height / 2 + MARGIN, resumeTop - MARGIN - colH);
    title.setY(Math.max(height * 0.18, colTop - MARGIN - title.height / 2)); // title yields, never above 18%
  }
  const colLeft = centerX - COL_W / 2;
  this.add.text(centerX, colTop, 'CONTROLS', textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5, 0);
  const g = this.add.graphics();
  g.lineStyle(1, PALETTE.ink, 1);
  g.line(colLeft, colTop + HEADER_H, colLeft + COL_W, colTop + HEADER_H);
  lines.forEach((line, i) => {
    this.add.text(colLeft, colTop + HEADER_H + HEADER_GAP + ROW_H / 2 + i * ROW_H, line, textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
  });
}
```
6. `npm run check`.

### Pitfalls
- Landscape mirror is `width/2 - 110 - 28 - 100` — 28 px left of the buttons' LEFT edge; The Index is `+110 + 28 + 100` on the right. Do not flip only part of the sign (card must end at `width/2 - 138 - ... `i.e. right edge `width/2 - 138`… exactly `width/2 - 110 - 28`).
- Portrait relief is ONLY `title.setY`, clamped at ≥ `0.18 * height`; never shrink `ROW_H`/fonts (keep 18/13, The Index's sizes). At 412x915 the 6-line card fits by moving the title from 0.3 to ~0.28 of the height.
- The card is display-only: no `setInteractive`, no pointer events, no listeners — Resume/Quit/Esc/P keep working, nothing to remove on shutdown. Don't touch the two buttons or the titleStyle args.
- Forgetting the empty-state `return colTop;` makes the method `number | undefined` — typecheck fails.
- No glow/box/shadow on the card: ink text on paper + one 1 px `g.line` rule only.

### Tests
none
