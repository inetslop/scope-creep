---
id: T0220
title: "The combo window is a bar: the ×N counter's clock you can see"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-29T16:54:18Z
---

## Goal
The kill-combo chain (T0031) breaks 1.5 s after the last kill, and nothing on the board shows that clock — a player can't tell how much tempo is left before the ×N, and its gold milestone (T0066), dies. The counter wears a thin bar that empties with the window, so the chain's life is read at a glance.

## Details
- What exists: the ×N kill-combo counter (T0031) — a rising muted-ink "×2, ×3" above the last kill, driven by the chain's state in `src/systems/FxSystem.ts`; at ×10 and up the counter wears the milestone yellow (T0034); the chain window is 1.5 s, refilled by each kill, and runs on the run's simulation clock (so at 2x speed it passes twice as fast, T0019).
- The change: while the counter is visible, a thin bar sits just under it, centered on it: about 26 px wide, 4 px tall, 2 px rounded ends. A track in the muted ink at about 20% alpha, and a fill in the counter's own color (the muted ink; the milestone yellow at ×10 and up, matching the counter, T0034) that drains from full to empty over the chain's 1.5 s window. A new kill (the counter rising to the next ×N) snaps the fill back to full. The bar appears and fades exactly with the counter — no bar while the counter is gone, no bar on a single kill.
- It is a draw, not a new timer: it reads the chain's existing window state (the six chain fields T0031 added to FxSystem), so the bar empties at exactly the moment the chain would break, and it stays honest at 2x (the fill drains twice as fast, as the window does). FxSystem gains no new state.
- New file: the bar's draw lives in its own small file (the Push wind-up ring's pattern, T0058 — a thin time-driven draw that sits beside the thing it describes), called from FxSystem where the counter is already drawn; the exact file placement is the architect's.
- Display only: the counter, the chain, the combo gold (T0066), the milestone (T0034) and everything else behave exactly as before. No sound, no input, no HUD card — the bar is a board-space readout that zooms and pans with the board, the way the counter does.
- Closest examples: the kill-combo counter (T0031) for the anchor and the colors; the Push wind-up ring (T0058) for the thin time-driven draw.

## Acceptance criteria
- [ ] While the ×N counter is visible, a thin rounded bar sits just under it: full right after a kill, draining to empty over the 1.5 s window; a new kill snaps it back to full.
- [ ] The bar is the counter's color (muted ink, milestone yellow at ×10 and up) over a ~20%-alpha muted-ink track, and it appears and fades exactly with the counter — no bar on a single kill or once the chain is gone.
- [ ] The bar empties at exactly the moment the chain breaks, and it drains twice as fast during the 2x speed, so it always agrees with the counter at 1x and 2x.
- [ ] No new state in the chain logic, no sound, no input, no HUD card; the counter, the combo gold and the milestone behave exactly as before, and the smoke test passes on desktop and mobile.
