---
id: T0047
title: The claim card says Score
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-28T12:01:28Z
epic: E1
---

## Goal
The number that ranks a run is seen where the run is claimed: the rewards card's count-up gets a Score line.

## Details
- The rewards claim card (the count-up that opens after a finished run) shows a new "Score N" line, where N is the run's score — the same number the end-of-run screen already shows today.
- It counts up with the other lines (waves held, stopped, clean, coins) in the same style and timing.
- Placement: the "Score N" line sits just above the "+N coins" line, so the coins stay the final, most prominent line. With no clean waves the order reads: Waves, Stopped, Score N, +N coins.
- No rule change: the score is computed exactly as it is today; this only adds its display to the claim card.

## Acceptance criteria
- [ ] After any finished run, the rewards claim card counts up a "Score N" line showing the run's score — the same number the game-over screen shows.
- [ ] The Score line sits just above the "+N coins" line and counts up in step with the other lines.
- [ ] The score value is unchanged from today's calculation; only its display on the claim card is new.
