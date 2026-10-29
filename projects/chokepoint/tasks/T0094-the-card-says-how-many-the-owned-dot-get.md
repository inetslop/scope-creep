---
id: T0094
title: "The card says how many: the owned dot gets a count"
size: S
priority: 3
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T01:36:24Z
claimed_at: 2026-10-29T01:58:34Z
epic: E4
designer: cachyos-x8664
---

## Goal
The draft's owned mark (T0044) grows a number: "stack this one" vs "branch this one" has a count, not just a dot, so the value of a second copy (Momentum-style stacking, the second pick T0065, a reroll) is read before the name is.

## Details
- A draft card whose augment the run already holds — the owned dot in its top-right corner (T0044) — shows, beside the dot, one small muted "×N": 12 px, muted gray, the same text class as the tier word on the card's name line ("Name · Rare", T0026).
- N = the copies of that augment the run holds: in the hand and in every tower's slots — T0044's "picked at least once, in any tower or the hand", counted.
- The count is shown only for N ≥ 2. At N = 1 the dot stays alone, byte-identical to today.
- The mark is part of the card's face, like the dot: it appears with the reveal flip (T0024), not before; a reroll (T0036) re-rolls the cards and the counts with them; the count is read fresh on every draft, so a copy built into a tower since the last draft changes what the next draft's cards show.
- Closest example: the owned dot (T0044) in the same corner of the same draft card — the count sits beside it, not a new line; the tier word (T0026) for the muted 12 px number style.
- No new line on the card (it does not grow), no rule change, no input, no sound, no pause-screen line.

## Acceptance criteria
- [ ] A draft card for an augment the run holds two copies of (in the hand and/or any towers) shows the dot and a small muted "×2" in the top-right corner; three copies show "×3".
- [ ] A card for an augment the run holds exactly one copy of shows the dot alone, as today.
- [ ] The count spans hand and towers: a card with one copy in the hand and one in a tower reads "×2"; after the run builds a second tower with that augment, the next draft's card reads "×3".
- [ ] A reroll (T0036) shows the counts on the re-rolled cards.
- [ ] Nothing else on the card moves, the card gains no line, no text is below 12 px, and no sound, input or pause-screen line was added.
