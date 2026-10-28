---
id: T0056
title: "The claim card says Board: the run's board as a four-letter code"
size: S
priority: 3
status: designing
depends_on: [T0051]
attempts: 0
created: 2026-10-28T13:04:03Z
claimed_at: 2026-10-28T13:34:01Z
epic: E1
designer: desktop
---

## Goal
A memorable run is nameable: the rewards card shows the run's board as a short four-letter code, so a great board can be remembered and shared — the first step toward replaying a board (the ghost run in IDEAS).

## Details
- A new line on the rewards claim card, below the "+N coins" line: "Board ABCD" — four uppercase letters (A–Z) derived deterministically from the run's board seed: the same run always shows the same code, and two runs on different boards show different codes. The code never depends on time, on the run's outcome, or on luck.
- The line is the same muted ink and type size as the card's other secondary lines, and it appears with the card (no count-up — it is a label, not a number).
- Read-only: no copy button, no replay, no input of any kind. (Replaying the board is a later idea.)
- The card stays a centered white rounded card with all its lines at 412x915 and 1280x720 — the same compact spacing the "Score" (T0047) and "Best combo" (T0051) lines use.

## Acceptance criteria
- [ ] The claim card shows a "Board ABCD" line (four uppercase letters, A–Z) below the "+N coins" line, in muted ink, appearing with the card.
- [ ] The same run (same board seed) always shows the same code; two runs on different boards show different codes.
- [ ] The code is a readout only: no button, no replay, no sharing UI, no gameplay effect.
- [ ] The full card fits on 412x915 and 1280x720, centered, with every other line unchanged.
