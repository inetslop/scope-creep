---
id: T0005
title: "Clean waves: a chip at the exit and a green line on the card"
assignee: inet-racing
size: M
priority: 2
status: design
depends_on: [T0001]
attempts: 0
created: 2026-10-28T01:07:07Z
epic: E1
---

## Goal
A perfect wave is noticed: the player sees in the moment when they held a wave without leaking, and it is worth something.

## Details
- Data: T0001's run ledger already counts clean waves (a wave that ends with zero leaks) and pays +1 coin each; this task is the display only.
- When a wave ends with no leaks, a small rounded green chip reading "Clean" pops at the path's exit: scale in over 200ms, hold, fade out after ~1.2s. It never plays on a wave with a leak.
- On the game-over card, the "Clean N" line (from T0001) turns green when N > 0 (stays gray/plain at 0).
- No new inputs; no pause-screen change.

## Acceptance criteria
- [ ] A wave with zero leaks shows the green "Clean" chip at the exit once; a wave with any leak shows nothing.
- [ ] After a run with clean waves, the game-over card's "Clean N" line is green; with none, it is plain.
- [ ] The chip is readable at 412x915, sits at the exit without covering the road, and fades on its own.
- [ ] The chip does not block the player's view of enemies still on the path.
