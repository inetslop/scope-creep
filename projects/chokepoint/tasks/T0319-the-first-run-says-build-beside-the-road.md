---
id: T0319
title: The first run says build beside the road
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T01:13:09Z
epic: E11
---

## Goal
A first-time player sees the road and the cells beside it and nothing says what the cells are for; on the first run's first build phase, one small white card beside the first buildable cell says "Build beside the road" until the first tower stands. The second of E11's three hints (T0318 is the first).

## Details
- First run only (the profile's runsPlayed is still 0), first build phase only (the one before wave 1): during a wave the card is hidden; it never shows in a later build phase.
- The cell: the buildable cell closest to the entrance gate (straight-line distance) — the first cell a tower could stand on as the road enters the island. The card sits beside that cell, not on its face, in board space like the enemy's name tag (T0085), so it follows zoom and pan.
- Look: the HUD's own white card at name-tag scale: one line of bold ink, ~12 px, "Build beside the road".
- Dismissed by doing: the moment the run's first tower is placed, the card fades out and never comes back. A resumed first run that already has a tower standing never shows it (re-derived from the run's state, T0272's pattern).
- No sound, no input. One in, one out: first run only, gone by doing, and nothing painted on the cell or the island — a floating card, not a mark (T0140's notches were removed for being permanent marks; this leaves nothing behind).
- Untouched: placing, the countdown, the range ring while placing, the board itself.
- Closest example for the build: a new file in `src/systems/fx/` (a sibling of `src/systems/fx/streakTeach.ts`), shown and hidden by one guarded hook in the build phase's own system (`src/systems/Building.ts`), the card in the look of the name-tag chip (T0085) at white-card scale.

## Acceptance criteria
- [ ] On a fresh profile, the first build phase shows the "Build beside the road" card beside the buildable cell closest to the entrance; placing any tower fades it out.
- [ ] It never shows in a later build phase, in any run with runsPlayed ≥ 1, in a resumed first run that already has a tower, or during a wave.
- [ ] The card follows the camera's zoom and pan; nothing is painted on the cell or the island; no sound plays and the card takes no input.
- [ ] Placing, the countdown and the range ring behave exactly as before; the card fits at 412x915 and 1280x720.
