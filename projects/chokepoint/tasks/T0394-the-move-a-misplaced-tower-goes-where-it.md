---
id: T0394
title: "The move: a misplaced tower goes where it should (the T0382 re-file)"
assignee: asus
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-02T01:03:06Z
claimed_at: 2026-11-02T04:16:25Z
epic: E15
design_attempts: 1
---

## Goal
In the build phase a tower can move to any free build cell for a fee, keeping its augments and its kills — repositioning against the wave preview is a real decision with a price (E15). The T0382 re-file, split smaller: the core only.

## Details
- The selected tower's panel wears a "Move · −N" bottom line, build phase only (like the Sell line): N = floor(60% of the tower's slots' total cost), minimum 5 — the sell's own rule at a lower rate. While the gold is short the line dims with the price in red, the reroll button's own short-gold pattern.
- Tapping the line opens the move state: the tower dims to ~50% alpha, every free build cell gets the placement's thin outline, and a tap on a free cell shows the what-if range ring at that cell (the placement ring's own look, the tower's current range) with the placement's own ✓/✗ beside it.
- ✓ commits: the gold pays the fee and a small muted "−N" chip pops at the old cell (the sell's gold-pop language, a minus), and the same tower object slides to the new cell over ~300 ms (ease-out), landing in the placement's drop-in bounce and place haptic. Its augments, kills, damage tally, tier pips and targeting mode all carry — no rebuild, no re-draw.
- A tower that lands on the marked cell wears its buff (the panel's "marked · +N%" line reads it live, T0387's line); a tower that moves off the marked cell loses it.
- ✗ or a tap on anything but a free cell cancels: the tower brightens, the outlines clear, nothing is paid.
- The resume needs no new state: the save at the wave's start carries the moved cell, and a tab closed mid-build resumes the pre-move snapshot with the fee unspent (the existing save timing, T0042).
- Not in this slice: the one-move-per-build-phase limit (the line's "moved" state) and the one-time teach line — they land behind this one; the commit's note is T0392.

## Acceptance criteria
- [ ] Build phase: the selected tower's panel shows "Move · −N" (N = floor(0.6 × its slots' cost), min 5) beside its sell line; the line is hidden during a wave
- [ ] Gold short: the line is dimmed with the price in red; tapping it does nothing
- [ ] Tapping it dims the tower, outlines the free build cells; a tap on a free cell shows its range ring and the ✓/✗ confirm
- [ ] ✓ pays the fee (the gold drops, the "−N" chip at the old cell), slides the same tower over in ~300 ms, drop-in bounce and place haptic on landing; its augments, kills and targeting mode are unchanged, and the marked cell's buff follows the tower (the panel line reads it)
- [ ] ✗ or a tap elsewhere cancels: no gold moves, the tower is back at full alpha, the outlines clear
- [ ] The sell line and the rest of the panel are untouched; the pause screen's controls list is unchanged (no new key or button); the panel fits at 412x915 and 1280x720
- [ ] `npm run check` and the desktop + mobile smoke pass

## Design (architect, cachyos-x8664)

### Files

- **`core/techEffects.ts`** — add `moveRefund(owned)` and `movePrice(slots, discount, owned)`, mirroring `sellRefund`/`sellPrice`.
- **`systems/Building.ts`** — add the move state: a `moveTower`/`moveCell` pair (the tower + the tapped free cell), the dim (alpha 0.5 on the tower), the free-cell outlines (via a new `Board` method), the range ring + ✓/✗ on a free-cell tap, the slide on ✓, the cancel on ✗/tap-elsewhere. Branch the `tap`/`confirmPending`/`cancelPending` to the move's confirm/cancel when the move state is active.
- **`systems/fx/pop.ts`** — new fx: the slide (the tower sliding to the new cell, ~300 ms) with the drop-in bounce re-triggered at the new cell, plus the gold-fee chip (a "−N" pop at the old cell) and the placement haptic.
- **`systems/fx/moveChip.ts`** — new fx: the gold-fee chip (a "−N" chip at the old cell, the fee paid).
- **`ui/hud/TowerPanel.ts`** — add the "Move · −N" line + button beside the sell line (build-phase only). Update the height calc (`H`, `below`) to fit it.
- **`systems/RunSave.ts`** — the save: the move's new cell is persisted by the existing `persist`/`restore` mechanism (the tower's `cell` is already saved as `{col, row}` and rebuilt via `new Tower` at the saved cell).
- **`entities/Tower.ts`** — make `cell` non-readonly (or add a `setCell` method) so the slide can update it; add a `moveTo(cell, board)` method that updates the cell, the `cellMul` (from `board.onMarked`), slides the token, and re-triggers the drop-in bounce.

### Interfaces

- **`moveRefund(owned: readonly string[]): number`** — the move's refund per 10 paid: the biggest owned `TOWER_NODES` `refund`, 2 (20%) when none is owned (8 with "Soft sell"). Same 10-per-refund mechanism as `sellRefund`.
- **`movePrice(slots: number, discount: number, owned: readonly string[]): number`** — the move's fee: `paid = Σ slotPrice(i, discount)` for `i in 0..slots`, then `Math.max(5, Math.floor(paid * moveRefund(owned) / 10))`. The `discount` is `run.slotDiscount` (5 per owned "Slot II" node).
- **Move state** (`Building.ts`):
  - `moveTower: Tower | undefined` — the tower being moved.
  - `moveCell: Cell | undefined` — the tapped free cell (the what-if preview).
  - On ✓: pay the fee via `run.spend(fee)`, call `tower.moveTo(newCell, board)` (slide + bounce), `board.place(newCell, tower)` + `board.place(oldCell, undefined)` (free the old cell), gold-fee chip at old cell, placement haptic, restore the tower's alpha to 1.
  - On ✗/tap-elsewhere: cancel (restore alpha to 1, clear the outlines, close the panel).
  - The move state cancels a held card and any pending touch cell, and closes the panel on commit/cancel.
- **Free-cell outlines** — a new `Board` method (e.g., `showMoveOutlines()`) that draws a thin outline on every free build cell; cleared by `board.showHover(undefined, false, 0)` on cancel.
- **Range ring + ✓/✗** — reuse `board.showHover(cell, ok, range)` (the placement's look) with the tower's current range; the ✓/✗ buttons are the move's own (not `PlaceConfirm`'s), with handlers branched to the move's confirm/cancel.
- **Gold-fee chip** — `fx/moveChip.ts`: a "−N" chip at the old cell (the fee paid).

### Steps

1. **`core/techEffects.ts`**: add `moveRefund(owned)` (default 2, max over owned `TOWER_NODES` `refund`) and `movePrice(slots, discount, owned)` (the fee).
2. **`entities/Tower.ts`**: make `cell` non-readonly; add `moveTo(cell: Cell, board: Board): void` that updates the cell, the `cellMul` (from `board.onMarked`), slides the token (~300 ms), and re-triggers the drop-in bounce.
3. **`systems/Board.ts`**: add `showMoveOutlines()` (a thin outline on every free build cell) and `clearMoveOutlines()`.
4. **`systems/fx/pop.ts`**: the slide (the tower sliding to the new cell, ~300 ms) with the drop-in bounce re-triggered at the new cell, plus the placement haptic.
5. **`systems/fx/moveChip.ts`**: the gold-fee chip (a "−N" chip at the old cell).
6. **`systems/Building.ts`**: add the move state (`moveTower`, `moveCell`). Branch `tap`/`confirmPending`/`cancelPending` to the move's confirm/cancel when the move state is active. On commit: pay the fee, call `tower.moveTo`, free the old cell, gold-fee chip, haptic, restore alpha. On cancel: restore alpha, clear outlines, close panel.
7. **`ui/hud/TowerPanel.ts`**: add the "Move · −N" line + button beside the sell line (build-phase only). Update the height calc to fit it.
8. **`systems/RunSave.ts`**: the save (the move's new cell is persisted by the existing mechanism).

### Pitfalls

- **The `cell` field is `readonly`**: the slide must update it (the board's `place`/`towerAt` and the panel's `cellMul` depend on it). Make it non-readonly or add a `setCell` method.
- **The marked cell's buff follows the tower**: the move's `moveTo` must update the tower's `cellMul` based on the new cell (via `board.onMarked`), so the panel's `markedLine` reads it correctly.
- **The save**: the move's new cell is persisted by the existing `persist`/`restore` mechanism (the tower's `cell` is already saved as `{col, row}` and rebuilt via `new Tower` at the saved cell). The save is likely not modified, but double-check the task's file list.
- **The free-cell outlines**: a new `Board` method (a thin outline on every free build cell). Cleared on cancel.
- **The range ring + ✓/✗**: a reuse of `board.showHover` (the placement's look) with the tower's current range. The ✓/✗ are the move's own (not `PlaceConfirm`'s), with handlers branched to the move's confirm/cancel.
- **The slide**: a tween on the tower (the `moveTo` method), and the drop-in bounce re-triggers at the new cell.
- **The gold-fee chip**: a new fx (`fx/moveChip.ts`), a "−N" chip at the old cell.
- **The line**: a new button in `TowerPanel.ts`, and the height calc is updated to fit it.
- **The sell line and the rest of the panel are untouched**: the move's line is added beside the sell line; the sell line button and the rest of the panel are unchanged.
- **The pause controls are unchanged**: the move's state does not touch the pause card.
- **The panel fits 412x915 and 1280x720**: the move's line + button must fit in the panel at both sizes.

### Tests

- **Acceptance 1**: build-phase selected-tower panel shows "Move · −N" beside the sell line, hidden during the wave.
- **Acceptance 2**: gold short → line dimmed, price red, tapping does nothing.
- **Acceptance 3**: tapping dims the tower + outlines free build cells, a free-cell tap shows the range ring + ✓/✗, ✓ pays the fee (gold drops, "−N" chip at old cell), slides the same tower ~300 ms (augments/kills/targeting unchanged), drop-in bounce at the new cell, placement haptic, the marked cell's buff follows the tower (the panel's line reads it), ✗/tap-elsewhere cancels with no gold paid + full alpha + outlines cleared.
- **Acceptance 4**: the sell line and the rest of the panel untouched, pause controls unchanged, panel fits 412x915 and 1280x720.
- **Acceptance 5**: `npm run check` and `npm run smoke` pass.
