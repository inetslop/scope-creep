---
id: T0034
title: "Combo milestone: at ×10 the counter turns yellow"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-28T08:30:13Z
claimed_at: 2026-10-28T08:44:58Z
designer: yoga
---

## Goal
A long kill chain pays off: at ×10 the kill-combo counter turns yellow and the milestone kill bursts bigger, so a fast hand is noticed the way a clean wave is.

## Details
- The kill-combo counter from T0031 is normally bold 14 px muted ink above the last kill. When a chain reaches ×10, the counter turns yellow — and stays yellow for the rest of that chain (×11, ×12, ...), until the 1.5 s window breaks.
- The kill that takes the chain to ×10 bursts with twice the usual chip count (same chip size, spread and color as a normal kill burst).
- A chain that breaks before ×10 never turns yellow. After a break, the next chain starts muted ink again.
- No sound, no new HUD element, no change to the combo window, the counter's size, position or fade.

## Acceptance criteria
- [ ] Chains from ×2 to ×9 look exactly as today: muted-ink counter, normal chip burst.
- [ ] The kill that takes a chain to ×10 bursts with twice the usual chip count, and its counter reads ×10 in yellow.
- [ ] The counter stays yellow through ×11, ×12, ... while the chain holds.
- [ ] After the chain breaks, the next chain's counter starts muted ink again.
- [ ] No change to the 1.5 s window, the counter's 14 px bold style or position, or any sound or other effect.
