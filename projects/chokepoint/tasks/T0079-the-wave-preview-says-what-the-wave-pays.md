---
id: T0079
title: The wave preview says what the wave pays
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-28T23:26:44Z
claimed_at: 2026-10-28T23:27:41Z
epic: E1
designer: yoga
---

## Goal
The break between waves has a price on it: the wave preview card (T0015) shows how much gold clearing the wave pays, so the build phase reads as a trade, especially now that Send (T0077) prices the rest of the countdown.

## Details
- One small muted line under the wave preview card during the build phase: "+N gold" — N is the wave's existing clear bonus, the same value the run pays when the wave is cleared (read from the wave plan / the clear flow, never recomputed a second way).
- Shown for every wave's preview, quiet waves included: the quiet wave's (T0071) clear bonus is unchanged by the quiet rule (only kill gold doubles), so the line shows the quiet wave's ordinary clear bonus.
- Muted ink, the preview card's own small text size (the counts' style), part of the same white card — no second card, no input, no sound, no count-up.
- The card grows by one fixed line height; the counts row and the quiet chip (T0071) keep their positions.
- Closest example: the preview card's own counts (T0015) and the quiet chip (T0071) — same card, same muted language; the line sits under the counts the way the claim card's recipe line (T0075) sits under its coins.

## Acceptance criteria
- [ ] During the build phase, the preview card shows "+N gold" under the counts, and N equals the clear bonus the run actually pays when that wave is cleared.
- [ ] The line is present on quiet waves (4, 8, 12, …) with that wave's unchanged clear bonus.
- [ ] Between waves and on the game-over/menu screens nothing changes; the line is only on the build-phase preview card.
- [ ] No layout change besides the one added line; desktop 1280x720 and mobile 412x915 smoke pass.
