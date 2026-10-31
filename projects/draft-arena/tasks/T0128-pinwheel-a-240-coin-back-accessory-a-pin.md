---
id: T0128
title: "Pinwheel: a 240-coin back accessory, a pink and white pinwheel that turns on a stick"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T21:28:31Z
epic: E26
---

## Goal
The back slot's missing 180→300 step: a 240-coin pinwheel, so every slot reaches 7 items and the shop's price ladders have no gap past 150 coins.

## Details
- A new back accessory "Pinwheel", 240 coins, no prestige lock: a new file `src/content/accessories/pinwheel.ts` (model it on `party-blower.ts` for the stick and `lollipop.ts` for a round head on a stick), registered in `src/content/accessories/index.ts` in price order between Party Blower (180) and Candy Cane (300).
- Look: a thin ink stick up off the back, and at its top a small pinwheel head about 0.9 of the body radius across: four triangular blades, two pink and two white (candy palette colors, ink outlines) around a small yellow center. It sits clear of the eyes and below the player's name.
- Motion: the blades turn at a constant slow spin, one full turn every 4 s, computed from the draw hook's `time` alone (the blade angle turns with time). No dependence on the critter's speed and no accumulated rotation: the hook is stateless and a speed-dependent spin was rejected for this accessory (T0122). The stick may keep the Party Blower's small instantaneous-speed sway, and nothing more.
- It changes nothing in play: no stats, no size. Bots may wear it at random like the other back items.

## Compared with what exists
| Existing | What it shares | How the new one looks different (not a recolor) |
| --- | --- | --- |
| Candy Pack | a small item on the back | a flat green pack; the Pinwheel is a round blade head that turns on a stick |
| Balloon | a round item on the back that moves | a bobbing sphere on a string above the back; the Pinwheel is a four-blade fan that rotates on a stick |
| Party Blower | a thin stick up off the back | a rolled red horn at rest on the stick; the Pinwheel carries a turning pink-and-white blade head |
| Candy Cane | a long curved item over the back | a red-and-white J-shaped cane; the Pinwheel is a small round head of four blades |
| Medal | a round yellow disc on the back | a still disc on a red ribbon; the Pinwheel's disc is a four-blade fan on a stick, in pink and white, and it turns |
| Lollipop | a round candy head on a short stick | a big still green swirl; the Pinwheel is smaller, four flat pink and white blades, and it turns |

## Acceptance criteria
- [ ] The Cosmetics panel lists Pinwheel in the back row at 240 coins; buying, previewing, wearing and taking it off work like the other back items, and what is worn is kept for the next visit.
- [ ] On a critter in the match the pinwheel reads at a glance: a stick off the back with four alternating pink and white triangular blades around a yellow center, ink outlines, no glow, clear of the eyes.
- [ ] The blades complete one full turn every 4 s whether the critter stands still or sprints (the spin does not change with speed).
- [ ] The back slot has 7 items and no price ladder between 80 and 400 coins has a gap bigger than 150 (back: 100, 120, 180, 240, 300, 400, 500).
