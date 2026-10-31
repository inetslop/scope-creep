---
id: T0115
title: "Smile: a 180-coin pattern, a light smile across the lower body"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T19:06:11Z
claimed_at: 2026-10-31T19:16:01Z
epic: E26
designer: yoga
---

## Goal
The pattern shelf's 11th, the step past the 150-coin Ring: a light smile across the lower body that reads on all 10 player colors.

## Details
- New pattern **Smile** (`src/content/patterns/smile.ts`), 180 coins, no prestige.
- Description (one line, under 70 characters): "A light smile across the lower body."
- Look: one bold light arc — the player's own color lightened with the shared light shade `shade(w.color, 0.35)`, like the other light patterns — a smile curve across the lower body, about 1.2 radii wide, its ends turned up about 0.2 radii, stroked at about 0.15× the body's outline width with round caps, clipped to the body and centred clearly below the mouth (about 0.55 radii under the body's centre) so it reads as a second, bigger grin on the belly, not part of the face.
- Model it on `src/content/patterns/ring.ts` (a single light stroke on the body in the shared light shade); register it in `src/content/patterns/index.ts` with one import and one registry line after Ring, the shelf's new top step.
- Price: 180 coins — the step past Ring (150); the shelf reads 100, 120, 150, 180 (the 12th, 200, follows in E26).
- No new test file: `ring.ts` has none — the content tests cover the shelf's price, name and one-line description.

## Compared with what exists

| Existing | What it shares | How the new one looks different |
| --- | --- | --- |
| Bands | light strokes across the body | a single turned-up arc on the lower body, not two straight bands |
| Spots | painted on the body | a light stroke, not five dark dots |
| Belly | the lower body, light | an open arc, not a filled round patch |
| Party | a light shape on the body | a smooth arc on the lower body, not a zigzag across the top |
| Halves | light paint of the body | a thin arc, not a half of the body painted over |
| Diagonal | light strokes across the body | one curved arc, not two straight diagonal stripes |
| Lolly | a light curve on the body | a short turned-up smile, not a multi-turn spiral |
| Star | one light shape in the body | a wide arc across the lower body, not a star in the middle |
| Cheeks | light shapes by the face | one arc on the belly, not two dots on the cheeks |
| Ring | one light stroke around the body | an open smile arc, not a closed ring around the middle |

## Acceptance criteria
- [ ] The Cosmetics panel lists Smile at 180 coins with no prestige lock; buying and wearing works and is kept for the next visit.
- [ ] Worn, it shows the light turned-up arc across the lower body in the player's own lightened color, clearly below the mouth, readable on all 10 player colors with the face easy to see.
- [ ] The preview critter wears it in the panel, and bots that own it show it in the match.
- [ ] Nothing in play changes: no stat, no size, no hitbox difference for a critter wearing it.
