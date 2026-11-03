---
id: T0472
title: The claim says what the reserve bought
size: S
priority: 2
status: design
depends_on: [T0463]
attempts: 0
created: 2026-11-03T04:35:57Z
epic: E24
---

## Goal
The claim card (the run's ledger) names the heavy reserve cards the run bought, so the end card tells the whole story of the run — including its 80-gold decisions, which otherwise only flash as a wave chip.

## Details
- One muted line on the claim card (`src/scenes/RewardsScene.ts`, the card the coin-recipe line T0075 grows), directly under the "waves +A · stopped +B · clean +C" recipe line: "reserve: surge · wall" — the label "reserve:", then the names of the heavy cards the run bought, joined by " · ", in the fixed order surge, wall, harvest (regardless of which was bought first).
- It reads the run's reserve state (T0463's buy state) and lists whatever heavy cards the run bought from it — the wall (T0471) and the harvest show up here the moment their buys exist in that state, with no further change to this line.
- The line is hidden when the run bought no heavy card: such a run's claim card is byte-identical to today.
- The style is the recipe line's own (the same muted ink and size); the line fits the card at 412x915 and 1280x720 with the card's existing wrapping.

## Acceptance criteria
- [ ] A run that bought the surge shows the muted "reserve: surge" line directly under the claim card's coin recipe line; a run that bought no heavy card shows no line and an otherwise unchanged card.
- [ ] Once the wall is in (T0471), a run that bought the surge and the wall shows "reserve: surge · wall" in that order, whether the surge or the wall was bought first.
- [ ] The line fits the claim card at 412x915 and 1280x720 with the longest numbers on the card.
