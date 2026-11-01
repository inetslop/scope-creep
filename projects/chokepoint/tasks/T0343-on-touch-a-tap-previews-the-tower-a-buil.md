---
id: T0343
title: On touch, a tap previews the tower; a ✓ builds it, an ✗ cancels
size: M
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T06:40:31Z
claimed_at: 2026-11-01T06:40:34Z
designer: desktop
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
