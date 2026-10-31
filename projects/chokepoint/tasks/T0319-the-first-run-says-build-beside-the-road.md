---
id: T0319
title: The first run says build beside the road
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T01:13:09Z
epic: E11
---

## Goal
A first-time player sees the road and the cells beside it and nothing says what the cells are for; on the first run's first build phase, one small white card beside the first buildable cell says "Build beside the road" until the first tower stands. The second of E11's three hints (T0318 is the first).

## Details
- First run only (the profile's runsPlayed is still 0), first build phase only (the one before wave 1): during a wave the card is hidden; it never shows in a later build phase.
- The cell: the buildable cell closest to the entrance gate (straight-line distance) — the first cell a tower could stand on as the road enters the island. The card sits beside that cell, not on its face, in board space like the enemy's name tag (T0085), so it follows zoom and pan.
- Look: the HUD's own white card at name-tag scale: one line of bold ink, ~12 px, "Build beside the road".
- Dismissed by doing: the moment the run's first tower is placed, the card fades out and never comes back. A resumed first run that already has a tower standing never shows it (re-derived from the run's state, T0272's pattern).
- No sound, no input. One in, one out: first run only, gone by doing, and nothing painted on the cell or the island — a floating card, not a mark (T0140's notches were removed for being permanent marks; this leaves nothing behind).
- Untouched: placing, the countdown, the range ring while placing, the board itself.
- Closest example for the build: a new file in `src/systems/fx/` (a sibling of `src/systems/fx/streakTeach.ts`), shown and hidden by one guarded hook in the build phase's own system (`src/systems/Building.ts`), the card in the look of the name-tag chip (T0085) at white-card scale.

## Acceptance criteria
- [ ] On a fresh profile, the first build phase shows the "Build beside the road" card beside the buildable cell closest to the entrance; placing any tower fades it out.
- [ ] It never shows in a later build phase, in any run with runsPlayed ≥ 1, in a resumed first run that already has a tower, or during a wave.
- [ ] The card follows the camera's zoom and pan; nothing is painted on the cell or the island; no sound plays and the card takes no input.
- [ ] Placing, the countdown and the range ring behave exactly as before; the card fits at 412x915 and 1280x720.

## Design (architect, yoga)

### Files
- create `src/systems/fx/buildTeach.ts` — the "Build beside the road" chip (nameLabel.ts look, ink text); returns the chip so Building can fade it
- edit `src/systems/Building.ts` — `runsPlayed` ctor param, `teachChip`/`teachOver` fields, one public `syncTeach()` guarded hook
- edit `src/systems/RunFlow.ts` — one line in `update()`: call `this.s.building.syncTeach()`
- edit `src/scenes/GameScene.ts` — one line: pass `loadProfile(window.localStorage).runsPlayed` as Building's 7th ctor arg (line 134)
### Interfaces
```ts
// src/systems/fx/buildTeach.ts
import type Phaser from 'phaser';
import { DEPTH } from '../../config';
import { cssColor, PALETTE } from '../../content/palette';
import type { FxSystem } from '../FxSystem';
/** "Build beside the road" beside the entrance cell; up until Building fades it with fx.track. */
export function buildTeach(fx: FxSystem, x: number, y: number): Phaser.GameObjects.Container | null;
```
Body: copy `src/systems/fx/nameLabel.ts` (nameLabel) verbatim, changing only: text `'Build beside the road'`, `color: cssColor(PALETTE.ink)` (it uses muted), and `return chip;` instead of `fx.track(chip, 100, ...)` (the chip lives until dismissed).
Building.ts — add `import type Phaser from 'phaser';` first, `import { buildTeach } from './fx/buildTeach';` under the `goldCoin` import; fields after `hoverSeen`; ctor 7th param `private readonly runsPlayed: number,`; method after `brokenSelection()`:
```ts
private teachChip: Phaser.GameObjects.Container | null = null;
private teachOver?: boolean; // derived on first sync (resumed run), latched when the card shows

syncTeach(): void {
  if (this.teachOver === undefined) this.teachOver = this.towers.towers.length > 0;
  const should = this.teachOver === false && this.run.phase === 'build' && this.run.wave === 0 && this.runsPlayed === 0 && this.towers.towers.length === 0;
  if (this.teachChip !== null) {
    if (should) return;
    this.fx.track(this.teachChip, 300, { alpha: 0, ease: 'Quad.easeOut' });
    this.teachChip = null;
    return;
  }
  if (!should) return;
  const cell = cellsBesidePath(this.board.map).find((c) => this.board.canBuild(c)); // the cell autoBuild picks
  if (!cell) return;
  const c = this.board.centerOf(cell);
  const chip = buildTeach(this.fx, c.x, c.y - 44);
  if (!chip) return; // fx.full: next frame retries
  this.teachChip = chip;
  this.teachOver = true; // shown: never comes back, even if the first tower is sold
}
```
RunFlow.ts `update()`, after `const run = this.run;`: `this.s.building.syncTeach(); // the first run's build teach re-derives each frame (T0319)`
### Steps
1. Create `buildTeach.ts` as above (model on `nameLabel.ts`; keep the `resolution: 1 / fx.scene.scale.zoom` line and font stack verbatim).
2. Edit Building.ts: imports, two fields, ctor param, `syncTeach()`.
3. One line in RunFlow.update (top, all phases) and one line in GameScene line 134.
4. `npm run check`.
### Pitfalls
- Never import `ui/` in the fx file (it drags in debug/flags → window → breaks Node tests); replicate the font stack like nameLabel does.
- Dismiss only via `fx.track` (it destroys and decrements `live`); a direct `chip.destroy()` leaks the FxSystem counter.
- Offset `-44`: the chip (body −11..+9 about its centre) clears the cell top edge by 3 units, stays on the island's 40-unit margin for a row-0 cell, and misses the entrance gate; never move it onto the cell face or onto the island (floating container only).
- The RunFlow call must sit in all phases (top of update): only the build branch would leave the card on board when a tower-less countdown starts the wave.
- Sell path: `towers.length` can go back to 0 — `teachOver` latches on show, so the card must not reappear.
- Untouched: `tap`, `autoBuild`, `pickCard`, `showHover`, `buildLeftSec`. No sound, no input, no registration in MARKS/DECORATIONS/HUD parts/INVARIANTS.
### Tests
- none
