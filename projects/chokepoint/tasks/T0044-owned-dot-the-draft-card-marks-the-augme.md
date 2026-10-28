---
id: T0044
title: "Owned dot: the draft card marks the augment you already have"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-28T11:47:03Z
epic: E4
---

## Goal
The draft's core decision — stack what you have or branch into something new — reads at a glance: an offered card whose augment the run already carries shows a small dot, so what you own behind the three cards is visible without counting towers.

## Details
- On each of the three offered draft cards, when the run already has that augment — picked at least once this run, in any tower or in the hand — a small solid dot appears in the card's top-right corner: an 8 px circle in the muted gray the cards already use for secondary text, inset 10 px from the top and right edges of the card.
- The dot appears with the card's contents on the reveal flip (T0024) — it is not on the face-down back — and it is recomputed for the reroll's new offer (T0036).
- No other change to the card: the name line, numbers, gem row and frame stay exactly as they are; no text is added, nothing shifts.
- Closest example: the tier word on the name line (T0026) — another small mark on the same draft card. The card is drawn in `src/scenes/DraftScene.ts` (the file T0041's shimmer and T0026's tier word touch), with the shared card look from T0008.

## Acceptance criteria
- [ ] A run that has picked Bolt twice (a Bolt tower and a second Bolt) sees the dot on a Bolt card whenever the draft offers one, and no dot on the other offered cards.
- [ ] A run that has never picked an offered augment sees no dot on that card.
- [ ] The dot is not visible while a card is face-down and appears as the card lands face-up; on the next draft's face-down cards it is gone.
- [ ] After the once-per-run reroll, dots on the new offer reflect the run's augments as they are.
- [ ] The card's name line, numbers, gem row and frame are unchanged and nothing shifts; the dot is visible at both 412x915 and 1280x720.
