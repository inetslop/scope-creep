---
id: T0455
title: "The slow stretch: the board with a 3-cell slow run of road"
size: L
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-03T00:11:22Z
---

## Goal
About 1 in 4 boards carries a slow stretch: a 3-cell run of road where every walker crosses at 70% of its speed. The board's face gives one stretch of road double value — towers covering it get ~40% more shots at every enemy that crosses it — and the tint says where it is before the first wave. A board modifier in the cove, twin and loop's family (non-epic).

## Details
- The roll and the growth: on the board's growth from the seed, a ~1-in-4 seeded roll (the cove's, twin's and loop's pattern), independent of every other modifier — the fork, the loop, the cove, the twin, the far gate, the switchback's corridor and the marked cell (and its double mark) all compose with it; the stretch is a property of road cells, not a shape, so it sits on whatever road the seed grows.
- The stretch: 3 consecutive cells of the road. The choice favors straight runs: if the road has a straight run of 3+ cells, take the middle 3 of its longest straight run (a run of exactly 3 takes it whole); on the rare board with no straight run of 3 cells, take 3 consecutive cells around one bend (the bend chosen at random). The stretch must have at least one build cell on each side of the road (a stretch you can cover); if the chosen cells fail that, the board grows without the stretch — a quality promise, not a road feature (T0452's phrasing).
- The effect: an enemy whose center is on a stretch cell walks at 70% of its current speed — after every other speed change, so the thin road node's 10%, Haste's +30% and a Sprinter's ramp all compose with it (the stretch multiplies whatever the enemy would walk). It applies the moment the enemy's center enters the first stretch cell and ends the moment it leaves the last. A Dasher's committed dash is not slowed (the surge is a fixed 3 cells, like a Blinker's blink is a fixed hop), and a Flyer's flight is not slowed (it does not walk the road). Gusts, roots and blinks move enemies as they always do — the stretch only multiplies the walk, and an enemy pushed or blinked back onto the stretch walks slow again.
- The look: the 3 cells wear a soft blue tint on the road's own white — the road's surface, not a mark painted over it: no chip, no notch, no border, no number on the cells. A board without the stretch is byte-identical (plain white road, no tinted cell anywhere).
- The readout: the board facts name it in the facts' own dry line on a slow-stretch board (the cove and twin's pattern — "slow stretch"), so a player who sees the tint knows the board did it; the boards reference lists it as a board modifier with its source (the seed's roll, ~1 in 4) in the reference's own row, its small live board showing the tint (T0430/T0424's row pattern). No new HUD element, key, button, teach chip or sound: the tint, the facts line and the reference row are the whole readout, the way the cove and the twin ship their readout.
- Why it makes placing more interesting: an enemy spends 1/0.7 of the time inside the stretch, so a tower whose range covers it takes ~40% more shots at every crossing enemy — the slow run is where a build pays back, and the tint says so at the start of the run. On a rush wave (1.5× walkers) the stretch is where the wave's pace is clawed back (1.5 × 0.7 ≈ 1.05 inside it).
- The run save: nothing new — the stretch is part of the board grown from the seed (as the cove, loop and twin are); a resumed run regrows the same stretched board from its seed.
- The work lives in a new core module beside `src/core/cove.ts` and `src/core/twin.ts` (the closest examples: the seeded roll, the cell choice, the facts line and the reference row all follow them); the walk factor hooks into the enemy's per-frame walk where the thin road node's slow already applies; the road's look tints the 3 cells where the road's white is painted.

## Acceptance criteria
- [ ] A seeded ~1-in-4 roll gives a board the slow stretch, independent of every other board modifier (forked, looped, coved, twin boards can carry it, and it composes with all of them).
- [ ] On a slow-stretch board exactly 3 consecutive road cells wear a soft blue tint on the road's white, with a build cell on each side; no chip, notch, border or number on the cells; a board without the stretch is byte-identical (plain white road).
- [ ] An enemy walking a stretch cell moves at 70% of its current speed, composing with the thin road, Haste and a Sprinter's ramp; it is back to full speed the moment its center leaves the last stretch cell.
- [ ] A Dasher's dash and a Flyer's flight are not slowed by the stretch; an enemy pushed, rooted or blinked onto the stretch walks slow while on it.
- [ ] The board facts name the stretch in the facts' dry line on a slow-stretch board; the boards reference lists it with its seed roll, its row's small live board showing the tint.
- [ ] A resumed run regrows the same stretched board from its seed, with no change to the run save.
- [ ] No new HUD element, key, button, teach or sound; the game plays menu to game over on a stretched board, on desktop and mobile.
