---
id: T0127
title: "Sash pop: a star ring and a bright two-note chime when the streak sash appears"
size: S
priority: 2
status: designing
depends_on: [T0126]
attempts: 0
created: 2026-10-31T21:05:07Z
claimed_at: 2026-10-31T21:28:35Z
epic: E29
designer: desktop
---

## Goal
The sash arrives as a moment: a small star ring blooms where the streak is earned, and the streaker hears a bright chime — the streak is felt by eye and ear, for the wearer and for the field.

## Details
- A new field effect, sash-pop: a thin band with an ink rim (gold or green, matching the sash's tier) blooms from the player out to radius 30 over 0.3 s with 6 small stars of the same color, in the shape of the existing ring effect at a third of its size.
- It plays from the sash area itself — when the sash is first placed on a critter and again when its tier changes (`slots[0]` 1 to 2), the way the fizz-puddle plays the fizz-tick when its puddle strikes. A mere refresh of the 15 s timer (same tier) plays nothing. The director is not touched.
- It shows on every player's sash — a moment the whole field sees, like the crown's fall.
- A new sound in the audio layer, sash: a bright two-note (E6 then A6, 0.15 s, peak 0.06) — a step higher and shorter than the level-up chime, so a streak never sounds like a level-up. Yours only: it plays when your own sash first appears or changes tier, the way the plink plays only for your own pickups, with the sfx layer's gesture and match-on-screen gate, deduped per effect seed, and no more than one chime per 1.5 s for one player's sash.
- No HUD element: the sash is on the critter, the pay is already read by the coin chip and the coin tick.

## Acceptance criteria
- [ ] A sash appearing, or a gold-to-green change, blooms the sash-pop ring in the sash's color from the player; another player's sash blooms the same way.
- [ ] Your own sash appearance or tier change plays the two-note chime; another player's sash is silent to you.
- [ ] A sash that is only refreshed (the 15 s timer extended by another knockout in the chain, same tier) plays no ring and no chime.
- [ ] No more than one chime per 1.5 s for one player's sash; no new HUD element appears; the coin chip and the coin tick read the pay as before.
