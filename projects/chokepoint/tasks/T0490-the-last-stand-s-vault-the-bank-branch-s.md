---
id: T0490
title: "The last stand's vault: the bank branch's third node, the pay doubles at one life"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-03T11:18:16Z
epic: E29
---

## Goal
The bank branch (T0483's The deep vault, T0485's The high rate) is the tech's newest row; its third and final node is the last one — between-run coins buy the bank paying double in the run's most dangerous moment, so a run that banks deep is richest exactly when it is one leak from over.

## Details
- The "The bank" branch's third node, "The last stand's vault", 155 coins by the branch's depth rule (the row reads 30 / 85 / 155), bought once like its siblings and on for every run after the buy.
- While it is owned and the run is at exactly 1 life, the bank's pay at each wave start is doubled: the normal pay (the live rate on the run's gold, floored at +1, capped by The deep vault's +20 or the plain +10) is computed first, then ×2 while at 1 life. A +8 pay becomes +16; with The deep vault's +20 cap the last-stand pay tops out at +40. At 2 or more lives the pay is unchanged — byte-identical to an unowned run at those lives.
- The stats card's "bank +N" line (T0374) shows the doubled N while the run is at 1 life, so the boost is visible in the build phase before the wave starts; the pay and the shown number always agree.
- The pay is taken at the same two moments the bank already pays (the countdown's end and the big button's early send), on top of the banked seconds-gold, exactly as today — only the amount is doubled at one life.

## Acceptance criteria
- [ ] The tech screen's "The bank" row shows three nodes, the third reading "The last stand's vault" at 155 coins; buying it needs 155+ coins and it wears the owned mark once bought.
- [ ] In a run with the node owned at exactly 1 life, the bank pays twice what it would at 2 lives for the same gold (e.g. 100 gold at the 8% rate pays +16 instead of +8), and the stats card's "bank +N" line shows the doubled number during the build.
- [ ] A run without the node, or any run at 2 or more lives, pays the bank byte-identically to today; the unowned path is untouched.
- [ ] The node is on for every run after the buy, including resumed runs; The deep vault's cap and The high rate's rate still apply before the doubling.
