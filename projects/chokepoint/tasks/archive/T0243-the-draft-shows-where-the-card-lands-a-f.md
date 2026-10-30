---
id: T0243
title: "The draft shows where the card lands: a fit row on every offered card (the T0238 re-file)"
assignee: desktop
size: L
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-30T00:29:56Z
claimed_at: 2026-10-30T01:50:22Z
finished_at: 2026-10-30T02:09:59Z
epic: E4
---

## Goal
The draft's pick becomes a placement decision: every offered card shows where it would land — the run's towers with a free slot — so "stack this one" vs "branch this one" is seen before the card is taken.

## Details
- Each offered card in the draft (the 3 or 4 of them) wears one extra row under its lines: a small token for every tower in the run with a free slot — the tower's first-augment icon wearing the what-if marker of this offered card (the same compact marker the ghost draws, T0096) — the first 3 towers in build order, then a muted "…". The row is hidden in the pre-wave-1 draft (no towers yet).
- The tokens are always live (full alpha): this task states no dim rule (T0236's dim idea failed and is dropped); the what-if ghost in the build phase keeps its own logic, untouched. A token is a small mark of where the card lands, not a promise of effect.
- The row is the draft's version of the ghost — the same information on the screen where the pick is made (the ghost is the board's version in the build phase, a different phase, not twice). It is display-only: no input, no sound, the odds line and the reroll untouched.
- The card grows to fit the row (the draft card already grows to its text, T0072); the row must fit at 412x915 (the 2×2 four-card grid) and 1280x720 (one row of cards) with the longest card lines.

## Acceptance criteria
- [ ] In a run with towers, the draft shows one token row per offered card: one token per tower with a free slot (first-augment icon + the card's what-if marker), the first 3 in build order then "…", and no row in the pre-wave-1 draft.
- [ ] Every token is drawn at full alpha (this task has no dim rule); the what-if ghost in the build phase behaves exactly as before.
- [ ] The draft still fits at 412x915 and 1280x720 with the row, including the four-card draft; picking a card, the reroll and the odds line behave as before.

## Design (architect, desktop)

### Files
- create `src/scenes/draftFitRow.ts` — builds one offered card's fit row: a small token per run tower with a free slot (its first-augment icon wearing the offered card's what-if marker, drawn by the ghost's own marker function), first 3 in build order then a muted "…"; `undefined` when no tower has a free slot.
- edit `src/systems/towerGhost.ts` — make the marker painter reusable: `private drawMarker` → `static drawMarker` (2 lines).
- edit `src/scenes/DraftScene.ts` — wire the row into each card and grow the card; generalize the portrait layout so the three-card phone draft takes the 2×2 grid when the row is on (three 220-px cards plus the row do not fit 412×915 in one column: worst card is Rally at H≈219, and the current column already leaves only 12 px).

### Interfaces
```ts
// src/scenes/draftFitRow.ts
export interface FitRow {
  container: Phaser.GameObjects.Container; // row content, centered on (0,0)
  height: number;                          // display height in CSS px, already × k
}
export function buildFitRow(scene: Phaser.Scene, k: number, copy: AugmentCopy, towers: Tower[]): FitRow | undefined;
// constants: const FIT = { token: 0.5, step: 26, height: 42 } as const;  // × k

// src/systems/towerGhost.ts
static drawMarker(g: Phaser.GameObjects.Graphics, copy: AugmentCopy): void;  // was private instance method
```
There is no dim rule: every token is drawn at full alpha. The marker may come only from the ghost's own draw code (never a second implementation).

### Steps
1. `towerGhost.ts`: line 36 `this.drawMarker(g, copy);` → `TowerGhost.drawMarker(g, copy);`; line 52 `private drawMarker` → `static drawMarker`.
2. No dim rule: every token is drawn at full alpha.
3. Create `src/scenes/draftFitRow.ts`:
```ts
import Phaser from 'phaser';
import { artScale, augmentTexture } from '../art/textures';
import { PALETTE } from '../content/palette';
import type { AugmentCopy } from '../content/types';
import type { Tower } from '../entities/Tower';
import { TowerGhost } from '../systems/towerGhost';
import { textStyle } from '../ui/text';

const FIT = { token: 0.5, step: 26, height: 42 } as const;

export function buildFitRow(scene: Phaser.Scene, k: number, copy: AugmentCopy, towers: Tower[]): FitRow | undefined {
  const free = towers.filter((t) => t.freeSlots > 0);
  if (free.length === 0) return undefined;
  const shown = free.slice(0, 3);
  const container = scene.add.container(0, 0);
  shown.forEach((tower, i) => {
    const x = (i - (shown.length - 1) / 2) * FIT.step * k;
    const icon = artScale(scene.add.image(x, 0, augmentTexture(tower.augments[0]!.id)), FIT.token * k);
    const marker = scene.add.graphics().setPosition(x, 0).setScale(FIT.token * k);
    TowerGhost.drawMarker(marker, copy);
    container.add([icon, marker]);
  });
  if (free.length > 3) {
    const dot = scene.add.text(0, 0, '…', textStyle(12, PALETTE.muted));
    dot.setOrigin(0, 0.5);
    dot.setPosition((shown.length - 1) * FIT.step * k * 0.5 + 11 * k + dot.width / 2, -2 * k);
    container.add(dot);
  }
  return { container, height: FIT.height * k };
}
```
4. `DraftScene.ts`: add `import { buildFitRow } from './draftFitRow';`; after `const opening = …` add `const hasRow = game.towers.towers.some((t) => t.freeSlots > 0);`
5. Replace `cardWidth` (line 79): `const cardWidth = (w: number): number => w >= 740 ? (four ? 165 : CARD_W) : four ? 121 : hasRow ? 178 : CARD_W;`
6. In `cardSlot`, change the grid branch condition `if (four)` to `if (four || (w < 740 && hasRow))`, and inside it replace the x line with: `const x = i === 2 && !four ? w / 2 : w / 2 + (i % 2 === 0 ? -1 : 1) * (cw + (four ? 24 : 16)) / 2; return { x, y: top + 84 + H / 2 + r * (H + 16) };` (same y formula as today; the lone third card sits centered in row 2).
7. In `layout()`: `const rows = width < 740 && (four || hasRow) ? 2 : cards.length;` — use `rows` for both `portrait(height, …)` and `rerollSlot(width, height, …)` (line 245 currently passes `cards.length`).
8. In `buildRow`: add `fit: buildFitRow(this, k, copy, game.towers.towers)` to each entry of `lines`; in the H line add `+ (l.fit ? 10 + l.fit.height : 0)` inside the map; destructure `fit` in the cards map; after `addedLine.setPosition(…)` add `if (fit) fit.container.setPosition(0, addedLine.y + addedLine.height + 10 + fit.height / 2);`; append `...(fit ? [fit.container] : [])` to the `button.content.add(…)` list.
9. `npm run check` and `npm run smoke` (both sizes).

### Pitfalls
- Every row object must end up inside `button.content` (the reroll's `c.button.container.destroy()` destroys the content tree); never leave scene strays.
- The card must grow only when the row shows: the `l.fit ? … : 0` term is per-card; pre-wave-1 (no towers) and all-towers-full keep today's H and today's single-column layout (hasRow false).
- Pass `rows` (2), not `cards.length`, to `rerollSlot` in the 2-up portrait or its y formula lands wrong.
- Don't touch the 4-card 2×2 offsets (gap 24, width 121), the landscape widths (220/165), the odds line, reroll or pick code — only the new branch for the three-card-with-row portrait.
- Never reimplement the marker; every token is at full alpha (this task has no dim rule).
- Verified budgets: 4-card 2×2 at 412×915 worst card (Rally, H≈318) leaves the reroll bottom at ~874 of 915 — tight, so check the phone smoke run; 3-card 2-up (178-wide, k≈0.81) leaves ~85 px spare.
- `tower.augments[0]` always exists (towers are built with their first augment).

### Tests
- none (display only)

## Result (attempt 1, desktop)

The draft now shows where each offered card would land: every card in a run with free tower slots wears a small fit row (first-augment token + the card's what-if marker, first 3 towers then "…"), drawn by the ghost's own marker painter (now `static` in `systems/towerGhost.ts`) at full alpha. New file `src/scenes/draftFitRow.ts` builds the row; `DraftScene` wires it into each card, grows the card to fit, and takes a 2-up portrait grid for the 3-card draft when the row is on (header and reroll placed against 2 rows). Pre-wave-1 drafts, the 4-card 2×2, landscape, odds, reroll and pick behavior are unchanged. `npm run check` and `npm run smoke` (desktop + phone) both pass.

- Self-review: APPROVE
- Time: 19.6 min

```
projects/chokepoint/game/src/scenes/DraftScene.ts  | 30 +++++++++-------
 projects/chokepoint/game/src/scenes/draftFitRow.ts | 41 ++++++++++++++++++++++
 projects/chokepoint/game/src/systems/towerGhost.ts |  4 +--
 3 files changed, 61 insertions(+), 14 deletions(-)
```
