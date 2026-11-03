---
id: T0485
title: "The high rate: the bank branch's second node, the rate 5% to 8%"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-03T10:07:19Z
epic: E29
---

## Goal
The bank branch's second node: 85 coins for the bank's rate 5% → 8% in every run after the buy, so a run that banks big earns more at each wave start and the deep vault's cap (T0483) binds later — the bank strategy gets its second real rung.

## Details
- The node: "The high rate" on the bank branch (the branch T0483 created), 85 coins by the depth rule, bought once like its siblings and on for every run after; the tech scene's bank row shows it (the row's owned/unowned pattern, T0369), and its node line names the effect in the branch's dry language ("the bank's rate 5% to 8%").
- The effect: the bank's pay at each wave start (T0363) uses the rate 8% instead of 5% — a 100-gold bank pays +8 where it pays +5 today; a 200-gold bank pays +16 where the old cap (+10) used to bind. The +1-up floor and the live cap (+10, or +20 with The deep vault) are untouched; the pay's own rounding rule is untouched.
- The reads: `core/tech.ts` gains the rate read `bankRate()` beside T0483's `bankPayCap()` (8 with the node, 5 without), and the run's pay path and the stats card's "bank +N" line read it, the way they already read the cap — no layout or text change to either, they simply show the live pay.
- The teach: the bank's one-time teach (T0431) is updated to wait on this node and build its line from the live rate, so an owner of the node hears "your gold pays 8% each wave" — T0431 is edited for that; this task does not touch its file.
- A run without the node is byte-identical: same pay at wave start, same "bank +N" line, same teach, same tests for the unowned case.

## Acceptance criteria
- [ ] The tech scene's bank row offers "The high rate" at 85 coins; buying it pays coins once, shows the owned mark, and is on for every run after.
- [ ] With the node owned, the wave-start bank pay is gold × 8% (min +1, capped by the live cap): 100 gold pays +8 (was +5), 200 gold pays +16 (was +10); without the node every pay is unchanged.
- [ ] `bankRate()` in `core/tech.ts` reads 8 with the node and 5 without; the stats card's bank line and the wave-start pay both read the live value with no layout change.
- [ ] A run without the node is byte-identical (same plans, same pays, same lines, same teach).
- [ ] Unit tests cover the node's row, price and buy refusal, `bankRate()` owned/unowned, and the pay at 8% under both caps.
