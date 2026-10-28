---
id: T0054
title: "Last stand: at one life left, kills pay double gold"
size: M
priority: 2
status: designing
depends_on: [T0045, T0039]
attempts: 0
created: 2026-10-28T13:04:03Z
claimed_at: 2026-10-28T13:29:44Z
epic: E1
designer: desktop
---

## Goal
A losing run becomes a loud, high-stakes comeback: while the run has exactly 1 life left, every kill pays double gold, so the last stretch is a gold rush — the risk is priced where it is taken, and it ends the moment a life comes back.

## Details
- **State:** last stand is on whenever the run's lives are exactly 1, and off whenever they are 2 or more. It engages the moment a leak brings lives to 1, and disengages the moment the clean streak's payback (T0045) raises them to 2 — if they later fall back to 1, it turns back on. It is a state, never a one-shot.
- **Effect:** while on, every kill pays 2× the normal kill gold, and the gold pop at the kill spot shows the doubled amount (the "+N" the player sees is twice the usual number, so the rule reads itself). Mint's +1 per copy (T0021, popped by T0039) is paid on top of the doubled kill gold and is never doubled. Wave bonus, starting gold, slot prices, the run's coin formula (T0001) and the score are untouched.
- **Readable:** while on, the lives number in the stats card is the same red the leak warning uses (T0014), and it pulses once at the start of every wave — scale 1.15 back to 1.0 over ~150 ms, the same pop timing as the coin tally's pop (T0017). The moment the state is off, the number returns to its normal ink. No banner, no sound, no new card in this task.

## Acceptance criteria
- [ ] A run at 1 life: every kill's gold pop shows 2× the usual amount, and the lives number in the stats card is red.
- [ ] While at 1 life, the red lives number pulses once at the start of each wave; at 2 or more lives the number is in its normal ink and does not pulse.
- [ ] The streak payback (T0045) that raises lives 1 → 2 immediately returns kill gold to normal and the number to normal ink; a later leak back to 1 turns double gold back on.
- [ ] A kill in a Mint tower's range while last stand is on pays the doubled kill gold plus the usual +1 per Mint (never a doubled +1), with Mint's "+1" pop (T0039) unchanged.
- [ ] Wave bonus, slot prices, the coin tally, the score, sounds and all other HUD are unchanged; works at 412x915 and 1280x720.
