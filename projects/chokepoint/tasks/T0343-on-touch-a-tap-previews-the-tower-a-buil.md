---
id: T0343
title: On touch, a tap previews the tower; a ✓ builds it, an ✗ cancels
assignee: asus
size: M
priority: 1
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-01T06:40:31Z
claimed_at: 2026-11-01T09:56:22Z
---

## Goal
The owner's call: on a phone, placing a tower is awkward. A mouse player sees the tower and its range under the pointer before clicking (`Building.hover`), but a touch player gets no preview: the tap builds the tower at once (`Building.tap`). On touch, the first tap must show the same preview, with a ✓ button to build there and an ✗ button to cancel.

## Details
- **Touch only.** The tap's pointer says it (`pointer.wasTouch`, where GameScene hands the tap to `Building.tap`). Mouse and keyboard play are unchanged: hover previews, a click builds.
- **First tap on an empty cell with a card held:** nothing is built and no gold is spent. The cell gets the hover preview a mouse player sees there (`board.showHover`: the cell outline in teal and the range circle of a new tower with that card). Two round buttons appear beside it: ✓ (ink, the primary) and ✗ (white card). Each is at least 44 px, screen-space (they stay the same size at any zoom), placed above the cell (below it when the cell is too near the top of the screen), ✗ left and ✓ right, kept fully on screen, and following the cell while the board is dragged or zoomed. The icons are drawn shapes (a check, a cross), no text glyphs.
- **✓** builds the tower there, exactly as today's tap does (same gold check and "Need N gold" hint, same panel opening, same sounds), and the buttons and preview go.
- **✗** cancels: the preview and the buttons go, nothing changes.
- **While a placement waits:**
  - a tap on another empty cell moves the preview and the buttons there;
  - a tap on the same cell keeps it as it is;
  - picking another card keeps the cell and redraws the preview for the new card;
  - a tap on a tower, the build phase ending, a draft opening, or the pause cancels it (the tap on the tower then does what it does today).
- **A cell that can't take a tower** (a rock, the road, not enough gold): no ✓/✗. Today's hint or deny sound plays, as now.
- **Unchanged on touch:** a tap on a tower with a free slot still puts the held augment in at once, because touch already shows the what-if ghost on every free tower.
- **The button placement is pure math** (a new `core/` module with unit tests): given the cell's screen rectangle and the view size, return the two button centers (above, or below near the top edge, clamped inside the screen).
- **The smoke test:** the phone run builds by tapping `window.__SC__.buildSpots()`. While a placement waits, `buildSpots()` (`debug/testHook.ts`) returns the ✓ button's screen point first, so a tap on a spot and then a tap on the first spot builds the tower. The desktop run is unchanged.
- Add an invariant to `INVARIANTS` (`debug/runChecks.ts`): a waiting placement only exists in the build phase, on an empty buildable cell.

## Acceptance criteria
- [ ] On touch, the first tap on an empty buildable cell shows the cell outline, the range and the ✓/✗ buttons, and spends nothing.
- [ ] ✓ builds the tower there (gold paid, panel open); ✗ removes the preview with nothing changed.
- [ ] Tapping another empty cell moves the preview; picking another card redraws it; the build phase ending cancels it.
- [ ] Mouse play is unchanged: hover previews, a click builds at once.
- [ ] Unit tests on the button placement: above the cell normally, below it near the top edge, never off screen.
- [ ] The phone smoke run still builds towers (through `buildSpots()` and the ✓).

## Design (architect, desktop)

### Files
- create `src/core/placeConfirm.ts` — pure math: the ✓/✗ button-row centers around a cell (above, below near the top edge, clamped on screen)
- create `src/ui/hud/PlaceConfirm.ts` — HUD part: the two round buttons (✓ ink, ✗ white card), follows the waiting cell every frame, publishes their screen circles as `placeButtons` in the scene registry
- create `tests/core/placeConfirm.test.ts` — unit tests for the placement
- edit `src/systems/Building.ts` — `pendingCell`, `tap(x, y, wasTouch)`, `confirmPending`/`cancelPending`/`syncPending`, `pickCard` redraw
- edit `src/scenes/GameScene.ts` — tap wiring (skip button taps, pass `p.wasTouch`), `overPlaceButtons()`, `buildSpots()` ✓-first, pause cancel, shutdown registry clear
- edit `src/systems/RunFlow.ts` — cancel the pending placement when a wave starts or the draft opens; re-assert its preview each frame
- edit `src/scenes/HudScene.ts` — one import + one line in `parts`
- edit `src/debug/runChecks.ts` — one invariant line next to `hand.selection`
- edit `src/debug/testHook.ts` — one doc line on `buildSpots` (✓ comes first while a placement waits)

### Interfaces
```ts
// core/placeConfirm.ts
export interface PlaceButtons { cancel: { x: number; y: number }; confirm: { x: number; y: number } }
/** rect + view in CSS pixels; size = button side (>= 44). */
export function placeConfirmButtons(rect: { x: number; y: number; width: number; height: number }, view: { width: number; height: number }, size: number): PlaceButtons
// GAP = 12 (between the two buttons and between cell and row). Row centered on the cell's x:
// cx = clamp(rectCx, rowW/2, view.width - rowW/2) where rowW = 2*size + GAP;
// y = above (rect.y - GAP - size >= 0) ? rect.y - GAP - size/2 : rect.y + rect.height + GAP + size/2, clamped to [size/2, view.height - size/2];
// cancel.x = cx - (size + GAP)/2, confirm.x = cx + (size + GAP)/2 (✗ left, ✓ right).
// ui/hud/PlaceConfirm.ts
export interface PlaceButtonsOnScreen { cancel: { x: number; y: number; r: number }; confirm: { x: number; y: number; r: number } }
export class PlaceConfirm implements HudPart { constructor(scene: Phaser.Scene, game: GameScene); layout(): void; update(game: GameScene): void }
// systems/Building.ts (all public)
pendingCell: Cell | undefined;
tap(x: number, y: number, wasTouch: boolean): void;   // signature changes; only caller is GameScene
confirmPending(): void; cancelPending(): void; syncPending(): void;
```
Registry key `placeButtons` (shared scene registry, like `statsGold`): `PlaceButtonsOnScreen | undefined`, written by the HUD part **every frame**, read by GameScene.

### Steps
1. **`src/core/placeConfirm.ts`** — the function above, plus a local `clamp(v, lo, hi)`. No Phaser imports (lint-enforced).
2. **`src/ui/hud/PlaceConfirm.ts`** — model on the `(this, game)` parts (`PauseButton`). Constructor: `size = 56`; `this.confirm = makeButton(scene, 0, 0, '', () => this.game.building.confirmPending(), { width: 56, height: 56, radius: 28, fill: PALETTE.ink })`; `this.cancel = makeButton(scene, 0, 0, '', () => this.game.building.cancelPending(), { width: 56, height: 56, radius: 28 })`. Icons are drawn shapes, no glyphs: a `scene.add.graphics()` added via `button.content.add(g)` (so it lifts) — check: `lineStyle(5, PALETTE.card, 1)`, `beginPath(); moveTo(-10, 2); lineTo(-3, 9); lineTo(11, -8); strokePath()`; cross: `lineStyle(5, PALETTE.ink, 1)` with two `moveTo/lineTo/strokePath` strokes `(±8, ±8)`. Both containers start `setVisible(false)`. `layout(): void {}` (the row re-fits every frame). `update(game)`: if `game.building.pendingCell` is undefined → hide both, `registry.set('placeButtons', undefined)`, return. Else: `c = game.board.toScreen(game.board.centerOf(cell))`; `px = game.board.toScreen({x:1,y:0}).x - game.board.toScreen({x:0,y:0}).x` (screen px per board unit, the `sellTower` trick); `side = CELL * px`; call `placeConfirmButtons({x: c.x - side/2, y: c.y - side/2, width: side, height: side}, viewSize(this.scene), 56)`; `setVisible(true).setPosition(...)` both; `registry.set('placeButtons', { cancel: {…r: 28}, confirm: {…r: 28} })`.
3. **`src/systems/Building.ts`** — add `pendingCell: Cell | undefined;` next to `selectedTower`. `tap(x, y, wasTouch)` (keep every existing line; the mouse path is byte-identical):
   - `if (!cell)` branch: `if (wasTouch) this.cancelPending(); return;`
   - tower branch: first line `this.cancelPending(); // a tap on a tower ends the waiting placement, then does what it does today`
   - `if (!held)` branch: add `this.cancelPending();` first
   - after the `!held` branch, insert the touch branch:
   ```ts
   if (wasTouch) {
     if (this.pendingCell && this.pendingCell.col === cell.col && this.pendingCell.row === cell.row) { this.syncPending(); return; } // same cell: keep it
     if (!this.board.canBuild(cell)) { this.sfx?.deny(); return; }
     if (!this.run.canAfford(slotCost(0)!)) { this.hint(cell, `Need ${slotCost(0)} gold`, PALETTE.red); return; }
     this.pendingCell = cell;
     this.syncPending();
     return;
   }
   ```
   - new methods (near `selectTower`): `confirmPending()` — `const cell = this.pendingCell; const held = this.heldCopy; if (!cell) return; if (!held) { this.cancelPending(); return; }`; then exactly today's commit from `tap`: `const result = this.towers.build(cell, held); if (typeof result === 'string') { if (result === 'gold') this.hint(cell, \`Need ${slotCost(0)} gold\`, PALETTE.red); else this.sfx?.deny(); return; } this.cancelPending(); this.run.useAugment(this.selectedAugment!); this.afterHandChange(); this.selectTower(result);`
   - `cancelPending()` — if no `pendingCell` return; set it `undefined`, `this.board.showHover(undefined, false, 0)`.
   - `syncPending()` — if no `pendingCell` or no `heldCopy` return; `this.board.showHover(cell, true, towerSpec([held]).range * CELL)` (the same preview `hover` shows for a new tower).
   - `pickCard`: after the existing `if (tower && tower.freeSlots > 0) this.placeHeld(tower);` add `else if (this.pendingCell) this.syncPending(); // the same cell, the new card's range`. Do not bump `uiVersion` for pending changes (the HUD part polls every frame).
4. **`src/scenes/GameScene.ts`**:
   - gestures `tap:` callback → `if (this.overPlaceButtons(p)) return; // a tap on the ✓/✗ is the buttons', not the board's` then `if (this.inPlayArea(p)) this.building.tap(p.worldX, p.worldY, p.wasTouch);`
   - new private method next to `inPlayArea`: `private overPlaceButtons(p: Phaser.Input.Pointer): boolean` — read `this.registry.get('placeButtons') as PlaceButtonsOnScreen | undefined` (import the type from `../ui/hud/PlaceConfirm`), `const at = pointerCss(p)`, true when `Phaser.Math.Distance.Between(at.x, at.y, b.confirm.x, b.confirm.y) <= b.confirm.r` or the same for `cancel`.
   - `setBuildSpots` closure: keep the `spots` filter exactly, then `const b = this.registry.get('placeButtons') as { confirm: { x: number; y: number } } | undefined; return b ? [{ x: b.confirm.x, y: b.confirm.y }, ...spots] : spots;`
   - `openPause()`: add `this.building.cancelPending();` before `this.scene.launch`.
   - shutdown handler: add `this.registry.set('placeButtons', undefined);` next to `hook.setBuildSpots(() => []);`
5. **`src/systems/RunFlow.ts`** — four lines: in `update()`, next to the `syncTeach` line: `this.s.building.syncPending(); // a drag or hover cleared the waiting placement's preview`; in `update()` where the countdown ends and in `startWaveNow()`, add `this.s.building.cancelPending();` before `this.s.waves.start();`; in `openDraft()`, first line `this.s.building.cancelPending();`
6. **`src/scenes/HudScene.ts`** — import `PlaceConfirm` (alphabetically between `PauseButton` and `SpeedButton`), and in `parts` add `new PlaceConfirm(this, game),` right after `new TowerPanel(this),` with a short comment.
7. **`src/debug/runChecks.ts`** — next to `hand.selection`: `['building.pending', (g) => { const c = g.building.pendingCell; if (!c) return null; if (g.run.phase !== 'build') return \`a placement waits in phase ${g.run.phase}\`; return g.board.canBuild(c) ? null : \`a placement waits on a taken or blocked cell (${c.col}, ${c.row})\`; }],`
8. **`src/debug/testHook.ts`** — extend the `buildSpots` doc comment: while a touch placement waits, the ✓'s point comes first.

### Pitfalls
- Taps on the ✓/✗ fire GameScene's scene-level input too (HUD is above but `BoardGestures` listens on the scene): `overPlaceButtons` must return before `building.tap`, or a ✓ tap also builds/moves a preview at the board point under the button. The button's own `pointerup` still fires (it `stopPropagation`s only inside the HUD scene) — one action per tap.
- The registry value is one frame stale (GameScene updates before HudScene; taps land between frames). Fine for stationary taps; never cache it across frames.
- `dragStarted()` and every tap clear the hover graphics; `syncPending` from `RunFlow.update` re-asserts the preview each frame (the T0272 `syncTeach` pattern) — that is why there is no per-tap-only redraw.
- Never pre-spend gold for the preview: `confirmPending` calls `towers.build` (the only `run.spend`), so a ✓ that fails shows the same hint and the pending stays.
- Touch targets: 56 px ≥ 44; the row is 124 px wide, fits 412×915. No `uiVersion` bump for the row (polling part); no new sounds; mouse path (`wasTouch === false`) must stay byte-identical, and `hover()` is untouched (touch never fires it, so `refreshGhosts`' every-free-tower behavior is unchanged).
- Buttons are hidden with `setVisible(false)`, never destroyed/recreated per show; the HUD scene is stopped at run end, and `placeButtons` is cleared on shutdown so a stale skip can't leak into the next run.

### Tests
- `tests/core/placeConfirm.test.ts` (vitest, idiom of `tests/core/view.test.ts`): normally above the cell, centered, ✗ left of ✓, `GAP` spacing; below the cell when the cell is within `size + GAP` of the top (and above at the exact boundary); for off-screen rects (far top-left, right of screen, below screen, bottom-left corner at 412×915) both centers stay within `[size/2, view - size/2]`.
