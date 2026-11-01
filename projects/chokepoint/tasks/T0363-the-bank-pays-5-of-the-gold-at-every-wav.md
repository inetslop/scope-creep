---
id: T0363
title: "The bank pays: 5% of the gold at every wave start, capped at +10"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-01T15:28:41Z
---

## Goal
The build phase gains a small spend-now-vs-bank decision: at the start of every wave the run's gold bank pays 5% interest, capped at +10 per build phase.

## Details
- **When:** the moment the build phase ends and the wave starts — both ways in: the countdown reaching zero, and the early send through the big round button (T0223). Exactly once per wave, on whichever path starts it. On an early send, the button's banked seconds-gold (2 per whole second) is added first; the interest is computed on the bank as a result.
- **How much:** floor(gold × 0.05), paid only when it is at least 1, capped at +10 per build phase. The run's first build phase pays it too (the starting gold), and so does every later one; a bank under 20 gold pays nothing.
- **Look and sound:** a small gold "+N" pop at the stats card's gold number (the T0017 pop with the T0039 pop's look), a coin trail to the tally (T0061's pattern) and the quiet coin blip (`Sfx.coinBlip`, T0255) — the same trio the kill gold already wears.
- **Teach:** a one-time muted line under the wave preview in the first build phase (the T0272 pattern, shown while no wave is cleared yet): "bank pays 5% at wave start · up to +10". Never shown again.
- **Gold, never coins:** the interest is run gold. It never enters the run's coin formula, the score, the claim card, the coins reference (T0329) or the profile.
- **Modes and levels:** no special cases — Iron doubles coins, not gold; Lean's thinner bounties simply bank less; the level multiplier is untouched.
- **Code shape:** the math is one small new pure module (the core/lastStand.ts pattern) with unit tests; the hook is the single wave-start transition — the one place the countdown and the early send both pass.

## Acceptance criteria
- [ ] A bank of 100 gold at a wave start earns +5 gold (a small gold "+5" pop at the gold number, a coin trail, the coin blip); 19 gold earns nothing; 500 gold earns +10 (the cap, not +25).
- [ ] The countdown and the big button's early send each pay the interest exactly once at the wave start; on an early send the banked seconds-gold is added before the interest is computed.
- [ ] The first build phase shows the one-time muted line under the wave preview; no later build phase does.
- [ ] The claim card's coin lines, the score, the coins reference and the profile are unchanged by the interest.
- [ ] The new pure module's unit tests pin the floor (paid only when the result is ≥ 1), the 5% rate and the +10 cap; npm run check and the desktop 1280×720 / mobile 412×915 smoke pass.
