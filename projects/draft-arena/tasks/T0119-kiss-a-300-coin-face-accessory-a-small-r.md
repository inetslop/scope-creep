---
id: T0119
title: "Kiss: a 300-coin face accessory, a small red kiss mark on the cheek"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T20:09:56Z
claimed_at: 2026-10-31T20:10:37Z
epic: E26
designer: yoga
---

## Goal
The face slot gets its 7th item and the shop's face ladder fills its 200→350 gap: a small red kiss mark on the cheek, so a player with a few lives always has a next save on the face shelf.

## Details
- **Kiss** is a face-slot accessory, **300 coins, no prestige lock**. Name "Kiss" (4 characters), description "A small red kiss mark on the cheek."
- **New file `src/content/accessories/kiss.ts`** — the closest example is `src/content/accessories/heart-shades.ts` (a 200-coin face item in the same slot). Register it in `src/content/accessories/index.ts` the same way: one import and one registry line, placed in price order (after Heart Shades, before Mustache).
- **Look:** a small red kiss on the **right cheek** — two little red lips drawn as a shallow "w" (about 0.18 of the critter's radius wide), ink-outlined, sitting at cheek height: below and beside the eye, clear of the mouth. It is a kiss on the cheek, not another mouth. A tiny time/seed bob, smaller and slower than the Candy's. Palette colors only (red, ink, a white glint), no glow.
- **Draw-only:** no stat, size or hitbox change, exactly like every other accessory.
- The face ladder becomes: 80 (Round Glasses, Bow Tie), 100 (Beak), 150 (Monocle), 200 (Heart Shades), **300 (Kiss)**, 350 (Mustache) — no gap bigger than 150 between 80 and 400. Face slot count: 7 of 10.

## Compared with what exists
One row for every accessory in the face slot:

| Existing | What it shares | How the new one looks different (not a recolor) |
| --- | --- | --- |
| Round Glasses | a face item | round ink frames around both eyes; Kiss is a small red mark on one cheek, away from the eyes |
| Bow Tie | a face item at the mouth | a red bow at the mouth; Kiss is on the cheek, above and beside the mouth, and is lips not a bow |
| Beak | a face item below the eyes | an orange triangle under both eyes; Kiss is two little red lips on one cheek, no triangle |
| Monocle | a one-sided face item | a gold lens over one eye with a chain; Kiss sits off the eye entirely, on the cheek, red lips not a lens |
| Heart Shades | a pink face item around the eyes | pink heart frames around both eyes; Kiss is red, on the cheek, a mark not a frame |
| Mustache | a face item near the mouth | a curly pink mustache over the mouth; Kiss is on the cheek, above the mouth's line |

## Acceptance criteria
- [ ] The Cosmetics panel lists Kiss on the face shelf at 300 coins; buying it spends 300 coins and wears it on the preview critter and on the player in-match; it is owned and worn on the next visit.
- [ ] A Kiss-wearing critter shows a small red kiss on the right cheek (two little ink-outlined red lips), clear of the eyes and the mouth, readable at a player's 36-unit size.
- [ ] It changes nothing in play: a player with Kiss plays identically to the same build without it (no stat, size or hitbox change).
- [ ] Bots can wear it, and it shows on the in-match crowd.
- [ ] A new test `tests/kiss.test.ts` (the closest example: `tests/candy.test.ts`) locks the face slot, the 300-coin price and the absence of a prestige lock.
