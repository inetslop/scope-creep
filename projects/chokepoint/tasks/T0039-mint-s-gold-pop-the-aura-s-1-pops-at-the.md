---
id: T0039
title: "Mint's gold pop: the aura's +1 pops at the kill"
size: S
priority: 3
status: designing
depends_on: [T0021, T0028, T0034]
attempts: 0
created: 2026-10-28T10:05:34Z
claimed_at: 2026-10-28T10:05:53Z
epic: E4
designer: yoga
---

## Goal
A Mint's extra gold is seen where it happens: whenever a kill pays a Mint's +1, a small gold "+1" pops at the kill spot, so a support tower that never fires is visibly working.

## Details
- Mint (T0021) already pays +1 extra gold per kill within its 2 cells, plus +1 more per extra Mint in the killing tower. This task adds only the visual: whenever any part of a kill's gold comes from a Mint bonus, a small gold "+1" pops at the kill spot — the same pop as the normal kill gold (same gold color, same rise and fade).
- One "+1" pop per Mint bonus paid: a kill in range of two Mint towers pops two "+1"s side by side; a Mint inside the killing tower pops one at the kill spot.
- The "+1" pops about 100 ms after the normal kill-gold pop, so the bonus reads as an addition on top.
- No change to gold totals, the run coin tally, sounds, or the normal kill-gold pop. No new HUD element.

## Acceptance criteria
- [ ] A kill within a Mint tower's 2 cells shows the normal kill-gold pop and, ~100 ms later, a small gold "+1" at the same spot.
- [ ] A kill covered by two Mint bonuses (two Mint towers in range, or a Mint in the killing tower plus one nearby) shows one "+1" per bonus, side by side.
- [ ] A kill with no Mint in range and no Mint in the killing tower shows only the normal gold pop, exactly as today.
- [ ] Gold totals, the HUD coin tally and all sounds are unchanged by the pop.
