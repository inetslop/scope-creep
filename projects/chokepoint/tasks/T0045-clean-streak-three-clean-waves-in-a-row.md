---
id: T0045
title: "Clean streak: three clean waves in a row give the run +1 life"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-28T11:47:03Z
claimed_at: 2026-10-28T11:47:05Z
epic: E1
designer: desktop
---

## Goal
A perfect stretch pays back in survival: three clean waves in a row give the run +1 life (once per run), on top of the clean-wave coins, so a flawless start buys a cushion against a later leak.

## Details
- The run tracks a clean streak: each clean wave (zero leaks — the green "Clean" chip moment from T0005) raises it by 1; any leak in a wave resets it to 0 at once.
- The moment the streak reaches 3, and only once per run, the run gains +1 life: the lives number in the stats card rises by 1. The starting lives count is unchanged; the payback may put lives one above it — the streak pays at most once, so never more.
- The streak is taught by the chip itself. Below the chip, centered on it, a small 12 px bold tag appears with the chip and fades with it:
  - streak 1: a muted gray "1/3"; streak 2: a muted gray "2/3".
  - streak 3 (the payback): a green "+1" in the same green as the Clean chip's text, and at the same moment the lives number in the stats card turns green and scales from 1.15 back to 1.0 over ~150 ms (the same pop timing as the coin tally's pop, T0017), then returns to its normal color.
  - After the one payback, clean waves show the plain chip with no tag, for the rest of that run.
- No change to clean-wave coins (the run ledger and its formula, T0001), the chip's look, position or timing (including the 1 s beat before the draft), any sound, the pause screen, the rewards card or the profile.

## Acceptance criteria
- [ ] Three clean waves in a row: the first two show the chip with a muted "1/3" and "2/3" below it; the third shows a green "+1" below it, the lives number rises by 1 and pops green (1.15 → 1.0 over ~150 ms).
- [ ] A wave with a leak shows no chip, as today, and resets the streak: the next clean wave tags "1/3".
- [ ] After the one payback, every later clean wave — including a second three-in-a-row — shows the plain chip with no tag and no extra life.
- [ ] Clean-wave coins, the chip's look and timing, the starting lives count, the rewards card, the profile and all sounds are unchanged.
- [ ] Works at 412x915 and 1280x720.
