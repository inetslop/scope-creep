---
id: T0104
title: "Lollipop: a 500-coin back accessory, a big green lollipop with a white swirl"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T17:29:12Z
claimed_at: 2026-10-31T17:30:41Z
epic: E22
designer: yoga
---

## Goal
The top of the back slot and the longest goal in the shop: a look that takes many matches and 2 prestiges in all, so the back ladder ends in a save instead of a dead end.

## Details
- One new back accessory in a new file, registered like the others: name "Lollipop", description "A big green lollipop with a white swirl on the back.", slot back, price 500 coins, prestige 2 (prestiges in all).
- How it looks: behind the body, a short stick (an ink line, about 1.5 body-radii long) rising up the right side of the back, topped by a round green disc about 1.2 body-radii across; the disc face carries a white spiral (2 turns, round-capped, painted like the Lolly pattern's light shade on the green); an ink outline on the disc; a gentle small bob with speed, slower and smaller than the Balloon's.
- It sits clear of the face: the disc's centre is behind the body, about one body-radius above the centre line, so the eyes, the mouth and every head item stay visible; it never covers the eyes.
- Palette candy colors and ink outlines only, no glow. Closest example to copy the shape of: src/content/accessories/candy-cane.ts (a new file src/content/accessories/lollipop.ts plus one import and one registry line in src/content/accessories/index.ts).
- In the shop it reads as the back slot's top: 500 coins, and "Needs 2 prestiges" exactly like the Medal until the profile has 2 prestiges in all.

## Acceptance criteria
- [ ] The Cosmetics panel's back row shows the Lollipop at 500 coins; without 2 prestiges in all it is locked with the same "Needs 2 prestiges" reason the Medal shows, and a player with them can buy it and wear it.
- [ ] A critter wearing it shows a green disc with a white spiral on a stick on its back, readable at a glance in a crowd, never covering the eyes or the face.
- [ ] It changes nothing in play: no size, no stats, no new sound; bots that wear it at random show it on the field.

## Compared with what exists
| Existing | What it shares | How the new one looks different (not a recolor) |
| --- | --- | --- |
| Candy Pack | a small candy item on the back | the pack is a little flat square at the lower back; the Lollipop is a tall stick topped by a round disc that rises above the body |
| Balloon | a round shape bobbing on the back | the balloon is a soft yellow sphere on a string; the Lollipop is a hard green disc on a short stick with a white spiral face |
| Party Blower | a candy on a stick | the blower is a flat red rolled spiral; the Lollipop is a full round disc with a painted spiral, and it bobs while the blower sways |
| Candy Cane | a striped candy on a stick, the other 300+ back goal | the cane is a thin red-and-white hooked rod with no round part; the Lollipop's mass is its green disc |
| Medal | the other back item gated behind 2 prestiges in all | the medal is a flat yellow disc on a red ribbon at chest height; the Lollipop sits higher on the back, is green and white, and costs 500 — the shop's longest goal |
