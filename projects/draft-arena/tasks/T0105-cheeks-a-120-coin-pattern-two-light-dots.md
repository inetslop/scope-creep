---
id: T0105
title: "Cheeks: a 120-coin pattern, two light dots on the cheeks"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T17:29:12Z
claimed_at: 2026-10-31T17:49:56Z
epic: E22
designer: desktop
---

## Goal
The pattern shelf's next step toward its 10th pattern: a bold, friendly pattern that reads at a glance, priced between the 100-coin Star and the 150-coin Ring that follows.

## Details
- One new pattern in a new file, registered like the others: name "Cheeks", description "Two light dots on the cheeks.", price 120 coins, no prestige.
- How it looks: exactly two light circles (the same light shade the other light patterns use, shade(w.color, 0.35)), one on each side of the mouth, centred on the lower body just below the eyes — each dot about a quarter of the body's width across, evenly mirrored so they read as a pair, like happy blushes. Clipped to the body like every pattern; the outline and the face go on top, so the eyes and mouth stay clear.
- It must read on all 10 player colors the way the light patterns do, and keep the face easy to see.
- Closest example to copy the shape of: src/content/patterns/belly.ts (one light circle clipped to the body) — this is two smaller ones, one on each side of the mouth. New file src/content/patterns/cheeks.ts plus one import and one registry line in src/content/patterns/index.ts.

## Acceptance criteria
- [ ] The Cosmetics panel's pattern row shows Cheeks at 120 coins; buying it costs 120 coins and it wears like the other patterns.
- [ ] On a critter of any of the 10 colors, exactly two light circles show on the lower body, one on each side of the mouth, bold enough to read at a player's size and clear of the eyes.
- [ ] It changes nothing in play and does not alter any existing pattern.

## Compared with what exists
| Existing | What it shares | How the new one looks different |
| --- | --- | --- |
| Bands | light shapes across the body | two full-width horizontal bands; Cheeks is two separated dots on the lower body only |
| Spots | dots on the body | five dark dots scattered over the whole body; Cheeks is exactly two light dots, mirrored, in the face area only |
| Belly | a light round shape on the lower body | one round patch centred under the mouth; Cheeks is a pair of smaller dots, one on each side of the mouth |
| Party | a light line across the top | a zigzag along the top edge; no round shapes, nothing on the lower body |
| Halves | a light area of the body | the whole top half in one flat tone; no separate shapes |
| Diagonal | two light stripes across the body | two long stripes corner to corner; no dots, nothing on the lower body |
| Lolly | a light swirl across the body | one spiral across the middle; no dots |
| Star | one light shape in the middle of the body | a five-point star in the centre; no pair, nothing by the mouth |
