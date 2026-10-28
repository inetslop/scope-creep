---
id: T0075
title: The claim card says why the coins are what they are
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-28T21:24:45Z
epic: E1
---

## Goal
The run's coin payout is explained where it is claimed: one muted recipe line under the "+N coins" on the claim card, so the number that carries over to the profile (E1) is readable, not just counted up.

## Details
- One muted line directly under the "+N coins" line on the rewards claim card (`src/scenes/RewardsScene.ts`, the file T0003 created and T0047/T0056 grew): "waves +A · stopped +B · clean +C", where A = the waves the run held, B = floor(enemies stopped / 10), C = the clean waves held — the run ledger's own coin formula (T0001: waves + floor(stopped/10) + clean). Read the same values the payout used; never recompute.
- All three terms are always shown, even at +0 — the formula is the point. The three terms always sum exactly to the "+N" shown.
- Shown with the card (no count-up), in the muted style of the Board line (T0056), one line below it. The card grows by one line height, the way the Score (T0047) and Board lines grew it; both 1280x720 and 412x915.
- No rule change: the coin formula, the payout and the profile are untouched — display only.
- Closest example: the Board line (T0056) — same placement under the coins, same muted style, no count-up.

## Acceptance criteria
- [ ] The claim card shows "waves +A · stopped +B · clean +C" in muted gray directly under the "+N coins" line, with A + B + C exactly equal to the N shown.
- [ ] A run with zero clean waves reads "clean +0"; the line is present on every claim and is shown with the card (no count-up).
- [ ] A resumed run's claim (T0042) shows the recipe of its own ledger.
- [ ] The card fits 1280x720 and 412x915 with the new line.
- [ ] `npm run check` and `npm run smoke` pass on desktop and mobile.
