---
id: T0083
title: The score says what it is made of
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-28T23:26:44Z
claimed_at: 2026-10-29T00:03:43Z
epic: E1
designer: yoga
---

## Goal
The number that ranks runs is explained where it is seen: the Score line on the claim card (T0047) and the game-over card get a small muted recipe under them, the claim card's coins-recipe pattern (T0075) applied to the score.

## Details
- Under the "Score N" line, one small muted line: the score's own terms from the run ledger in plain words — the exact values the score is computed from (read the score's real formula and name each term in the score's own units, e.g. "waves +A · stopped +B · clean +C" if that is the recipe). The terms always sum exactly to the score shown; all terms are always shown, even at +0.
- The line appears on both cards: the claim card (under T0047's Score line, shown with the card — no count-up, T0075's placement rule) and the game-over card (under its score line, same style).
- No rule change: the score value for any run is unchanged; nothing new is stored — the terms come from the ledger values the score already reads.
- Closest example: T0075's "waves +A · stopped +B · clean +C" line — same muted style, same "terms always sum to the number above" rule, same no-count-up placement.

## Acceptance criteria
- [ ] The claim card's Score line has a muted line under it whose terms are the score's own inputs and sum exactly to the score shown.
- [ ] The game-over card's score line has the same line in the same style.
- [ ] The score value is unchanged for a given run (a unit test pins one run's score before and after).
- [ ] Desktop 1280x720 and mobile 412x915 smoke pass with the extra line on both cards.
