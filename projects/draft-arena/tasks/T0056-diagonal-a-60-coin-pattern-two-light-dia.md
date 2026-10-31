---
id: T0056
title: "Diagonal: a 60-coin pattern, two light diagonal stripes across the body"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T10:47:58Z
---

## Goal
A sixth pattern for the shop: two light diagonal stripes, the next price step above Halves (50) — a new look to save for between the 40/50 coins items and the 80-coin face accessories.

## Details
A new pattern `src/content/patterns/diagonal.ts`, registered in the patterns index and sold by the shop like the others (closest example: `src/content/patterns/bands.ts`). Name "Diagonal", description "Two light diagonal stripes across the body.", price 60 coins, no prestige requirement. Look: two stripes drawn in the player's own color lightened the same way Bands and the other light patterns are, running diagonally corner to corner across the body, offset from each other, clipped to the body like every pattern, with the outline and face on top. Bold enough to read at 36 units across and on all 10 player colors.

## Acceptance criteria
- [ ] The shop shows "Diagonal" with a mini-critter preview wearing it, priced at 60 coins; buying it spends 60 coins and the player can wear it from the start screen, kept for the next visit.
- [ ] Worn, it reads as two light diagonal stripes on the critter's own color, on any of the 10 colors, with the face easy to see.
- [ ] Bots can wear it at random like the other patterns.
- [ ] `npm run check` and the desktop and mobile smoke runs pass.

## Compared with what exists

| Existing | What it shares | How the new one looks different |
| --- | --- | --- |
| Bands | light stripes across the body | Bands run horizontally across the middle; Diagonal runs corner to corner |
| Spots | painted over the body | five dark dots scattered; two light stripes on the slant |
| Belly | a light patch on the body | one round light patch on the lower body; two long light stripes at a slant |
| Party | light shapes on the body | a zigzag across the top like a paper hat; two straight diagonal stripes |
| Halves | a light area of the body | a flat cut that lights the whole top half; two thin slanted stripes leaving the rest the own color |
