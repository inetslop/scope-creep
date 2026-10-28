---
id: T0071
title: "Quiet wave: every 4th wave is a breather"
size: M
priority: 2
status: design
depends_on: [T0015, T0054]
attempts: 0
created: 2026-10-28T13:54:28Z
epic: E1
---

## Goal
A run has pressure and relief: every 4th wave is a quiet breather — half the enemies, double the gold per kill — so the build phase before it is a chance to spend, not a trap.

## Details
- **The rule:** every 4th wave (4, 8, 12, …) is a quiet wave: half the wave's usual enemy count (rounded up, minimum 3), with the same mix rules for that wave number (the same enemy types and proportions, fewer of them). Every other wave is exactly as it is today.
- **Gold:** each kill on a quiet wave pays 2× the normal kill gold, and the gold pop at the kill spot shows the doubled number (the same doubled-pop language as last stand, T0054). The kill-gold multiplier is the **product** of the multipliers that are on — quiet (×2) × last stand (×2) = ×4 when both are on, so a quiet wave inside the last stand is the run's richest minute. Mint's +1 per copy pays on top and is never doubled (T0021's rule); combo gold (T0066, once in) pays on top as usual.
- **The preview:** the wave preview (T0015 — the small card above the build countdown) shows the quiet wave's halved shape counts and gains a small muted-blue "quiet" chip at the left edge of the same card. Muted chip style, blue because it is relief — red is the leak warning's color and is never used for a breather. Non-quiet waves show no chip.
- **A quiet wave can be held clean:** zero leaks pops the green "Clean" chip (T0005) and counts for the clean streak (T0045) and the Momentum bonus (T0064) like any clean wave — the smaller count is exactly what makes it the easy clean.
- Chained behind T0054 on purpose: both tasks change the kill-gold line, so the multipliers land one at a time.

## Acceptance criteria
- [ ] Waves 4, 8, 12, … send half the usual enemy count (rounded up, minimum 3) with that wave's usual mix; waves 1–3, 5–7, … are unchanged.
- [ ] A kill on wave 4 pays 2× the normal kill gold and the gold pop shows the doubled number; a kill on wave 3 or 5 pays normal.
- [ ] The build phase before wave 4 shows the halved shape counts plus a small muted-blue "quiet" chip in the wave preview; the build phase before wave 3 shows no chip; the chip fits the preview card at 412x915 and 1280x720 without crowding the shapes.
- [ ] With last stand on, a kill on a quiet wave pays 4× the normal kill gold and the pop shows it; Mint's +1 is not doubled and pays on top.
- [ ] A quiet wave held with zero leaks pops the green "Clean" chip and counts for the clean streak like any clean wave; lives, wave escalation and enemy types are otherwise unchanged.
