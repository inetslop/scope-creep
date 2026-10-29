---
id: T0207
title: "A leak breaks the combo: the chain fades the moment a life is lost"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T12:51:15Z
claimed_at: 2026-10-29T13:02:17Z
designer: yoga
---

## Goal
A leak should cost more than the life. The moment any enemy leaks, the run's kill-combo chain (T0031) breaks: the ×N counter fades away and the next kill starts a fresh chain — so a sloppy run loses its reach for the combo gold (T0066) as well.

## Details
- On the leak event (an enemy reaches the exit and the run loses a life), the run's kill-combo chain resets: its count goes back to zero, and the current ×N counter, if visible, fades out in place over ~200 ms — the counter's own fade-out, no pop and no scale.
- The next kill after the break shows no counter; the second kill of the new chain starts the counter again at ×2, exactly as a normal chain does.
- No sound, no card, no new HUD element and no pause-screen line: the break is read from the counter simply not being there.
- Nothing else changes: the chain's 1.5 s window (T0031), the ×10 milestone color (T0034) and the milestone gold (T0066: +2 at ×5, +4 at ×10) all work as before on unbroken chains. A chain broken at ×4 pays its next milestone on the new chain's own ×5 — one kill later than it would have.
- It runs on the simulation clock: at 2x (T0019) the break and the ~200 ms fade both run at 2x, like everything else on the board.
- A leak while no chain is live (no recent kills) changes nothing visible.
- Closest examples: the ×N counter and its chain state live where T0031 drives them (FxSystem's `killCount()` and combo state); the leak event is where the leak jolt plays (T0109's `leak()` in the enemy system) — the break is one call into the counter's state from there.

## Acceptance criteria
- [ ] A leak while the ×N counter is up (×2 or more) clears the chain: the counter fades out in place, and the next kill shows no counter until the second kill of the new chain shows ×2.
- [ ] A leak with no live chain changes nothing on screen.
- [ ] No new sound, card, chip or HUD element; the pause screen is untouched.
- [ ] The ×5/×10 milestone gold (T0066) is paid only on an unbroken chain's own ×5/×10 kill.
- [ ] At 2x the break and the fade run on the scaled clock.
