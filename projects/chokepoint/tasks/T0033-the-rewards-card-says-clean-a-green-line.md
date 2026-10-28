---
id: T0033
title: "The rewards card says Clean: a green line for the waves you held"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-28T08:16:06Z
epic: E1
---

## Goal
The payout explains itself: the rewards claim card shows the clean waves you held, so a first-time player sees where part of the coins came from. It also completes E1's last unwritten slice — the card counts up waves held, stopped and +N coins, but never the clean waves that earn them.

## Details
- The rewards claim card (T0003's scene; exact file `game/src/scenes/RewardsScene.ts`) currently counts up three lines: waves held, stopped, +N coins. Add one line between "stopped" and "+N coins": "Clean N".
- N is the run's clean-wave count from the run ledger — the same number the coin formula (T0001) and the game-over card's green line (T0005) already use. Never recomputed.
- The line shows only when N > 0, in the same green as the "Clean" chip at the exit and the game-over card's line (T0005). When N = 0 the card looks exactly as today: three lines, unchanged height.
- Presence is decided before the count-up starts: the card is laid out at its final height from the beginning and the line counts up in place with the other lines, at the same pace (no layout jump mid-animation). Plain text, same size and style as the other lines, no icon.
- The card stays centered and inside the white card on 412x915 (portrait) and 1280x720 (landscape); it grows by exactly one line height (the same spacing the existing lines use).
- The "+N coins" line, its pop and the two-note chime (T0009) are untouched — they belong to the coins line only.
- Closest example: the green clean line on the game-over card (T0005) and the existing count-up lines in `RewardsScene.ts`.

## Acceptance criteria
- [ ] A run with one or more clean waves ends on the rewards card with a fourth line "Clean N" (N = clean waves from the ledger), in the same green as the exit's "Clean" chip, between "stopped" and "+N coins", counting up with the other lines.
- [ ] A run with zero clean waves shows the card exactly as today: three lines, same height, same timing.
- [ ] The card stays centered and fully inside the white card on 412x915 and 1280x720, the new line the same size and style as the others.
- [ ] The "+N coins" line, its pop and the two-note chime behave exactly as before.
