---
id: T0098
title: "Star: a 100-coin pattern, one light star on the middle of the body"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T16:11:39Z
claimed_at: 2026-10-31T16:12:13Z
epic: E21
designer: yoga
---

## Goal
The pattern shelf's next step: a 100-coin pattern past Lolly's 80, so the shelf reaches 8 and a player with a few lives always has a next save.

## Details
- One new pattern file, `src/content/patterns/star.ts`, plus one import and one registry line in `src/content/patterns/index.ts` after the last pattern; the closest example is `src/content/patterns/halves.ts` (a light shade of the player's own color, the same light shade the other light patterns use).
- How it looks: one five-point star, plain and bold, painted light (lighter than the player's own color) in the middle of the body, under the face, clipped to the body; the outline and the face go on top, as with every pattern. It changes nothing in play: no stats, no size.
- Name "Star", description "A light star on the middle of the body.", price 100 coins, no prestige. The shelf then reads 30, 30, 40, 40, 50, 60, 80, 100.

## Compared with what exists

| Existing | What it shares | How the new one looks different |
| --- | --- | --- |
| Bands | light shapes painted across the body | two horizontal bands; the star is one shape in the middle, not a stripe |
| Spots | small shapes on the body | five dark dots scattered; the star is one light shape, fixed in the middle |
| Belly | a light patch on the body | a round patch on the lower body; the star is a five-point shape in the middle |
| Party | a light shape across the top | a zigzag band across the top, like a paper hat; the star sits in the middle of the body |
| Halves | a light area of the body | the whole top half lighter; the star is one small bold shape |
| Diagonal | light stripes on the body | two diagonal stripes; the star is one shape, not a stripe |
| Lolly | a light pattern across the body | a lollipop swirl across the body; the star is one plain shape, not a swirl |

## Acceptance criteria
- [ ] The Cosmetics panel lists Star at 100 coins; picking it paints the light star on the preview critter, buying spends the coins, and wearing it keeps it for the next visit.
- [ ] The star reads on all 10 player colors (lighter than the own color) and on a 36-unit critter in a crowd; the face stays easy to see.
- [ ] Nothing in play changes: no stats, no size, no new HUD.
