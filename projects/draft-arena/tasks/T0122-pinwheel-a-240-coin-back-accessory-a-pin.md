---
id: T0122
title: "Pinwheel: a 240-coin back accessory, a pink and white pinwheel on a stick"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T20:44:19Z
claimed_at: 2026-10-31T20:45:03Z
epic: E26
designer: yoga
---

## Goal
The back slot gets its 7th item and the shop's back ladder fills its 180→300 gap: a small pinwheel that turns, so a player with a few lives always has a next save on the back shelf. Last task of E26.

## Details
- **Pinwheel** is a back-slot accessory, **240 coins, no prestige lock**. Name "Pinwheel" (8 characters), description "A pink and white pinwheel on a stick, on the back."
- **New file `src/content/accessories/pinwheel.ts`** — the closest example is `src/content/accessories/party-blower.ts` (a back item on a stick). Register it in `src/content/accessories/index.ts` the same way: one import and one registry line, placed in price order (after Party Blower, before Candy Cane).
- **Look:** a small pinwheel on a thin ink stick behind the body — four triangular blades around a small yellow center dot, two pink and two white, all ink-outlined, the blade circle about 0.5 of the critter's radius across, centered just above the stick's tip. The stick rises about 0.6 of a radius behind the body.
- **It turns:** the blades rotate slowly while the critter stands still (about one turn per 3 s) and spin faster while it moves (about one turn per 1.2 s at full speed) — drive it from `w.time` and the same speed value the Party Blower's sway uses, no `Math.random`/`Date`. It is the only back item that spins, which is how it reads in a crowd.
- **Draw-only:** no stat, size or hitbox change, exactly like every other accessory. It never covers the eyes.
- The back ladder becomes: 100 (Candy Pack), 120 (Balloon), 180 (Party Blower), **240 (Pinwheel)**, 300 (Candy Cane), 400 (Medal), 500 (Lollipop) — no gap bigger than 150 between 80 and 400. Back slot count: 7 of 10.

## Compared with what exists
One row for every accessory in the back slot:

| Existing | What it shares | How the new one looks different (not a recolor) |
| --- | --- | --- |
| Candy Pack | a back item | a small still green pack; the Pinwheel is four separate triangular blades on a stick, and it turns |
| Balloon | a back item that moves | a yellow balloon that bobs up and down; the Pinwheel spins in place on a stick, no bob |
| Party Blower | a back item on a stick | a red rolled-up horn, a closed spiral that only sways; the Pinwheel is an open wheel of four separate blades that spins |
| Candy Cane | a striped back item | a red-and-white cane hooked over the back, no stick and no motion; the Pinwheel is a turning wheel, not a hook |
| Medal | a round thing on the back | a flat still yellow disc with a red ribbon; the Pinwheel's blades are triangular, pink and white, and always turning |
| Lollipop | a round back item on a stick | a solid green disc with a white swirl; the Pinwheel has four separate blades with gaps between them, and it spins |

## Acceptance criteria
- [ ] The Cosmetics panel lists Pinwheel on the back shelf at 240 coins with the description "A pink and white pinwheel on a stick, on the back."; buying it spends 240 coins and wears it on the preview critter and in-match; it is owned and worn on the next visit.
- [ ] A Pinwheel-wearing critter shows four triangular blades (two pink, two white) around a yellow center on a thin stick behind the body, ink-outlined, spinning slowly when still and faster while moving, readable at a player's 36-unit size.
- [ ] It never covers the eyes, changes nothing in play (no stat, size or hitbox change), and bots can wear it and it shows on the in-match crowd.
- [ ] A new test `tests/pinwheel.test.ts` (the closest example: `tests/candy.test.ts`) locks the back slot, the 240-coin price and the absence of a prestige lock.
