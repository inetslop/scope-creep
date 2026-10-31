---
id: T0088
title: "Lolly: an 80-coin pattern, a light lollipop swirl across the body"
size: S
priority: 3
status: design
depends_on: []
attempts: 0
created: 2026-10-31T15:05:01Z
epic: E21
---

## Goal
The pattern shelf stops at 60 coins (Diagonal) and the price ladder has a next step to take: an 80-coin pattern that is a swirl, not another stripe, dot or patch.

## Details
- A new pattern `lolly` in src/content/patterns/ (the closest existing example is `diagonal.ts`), registered in the patterns index exactly like the others.
- Name "Lolly", price 80 coins, no prestige requirement.
- Description: "A light lollipop swirl across the body."
- How it looks: one light spiral, a lollipop swirl — it starts at the body's centre and winds out toward the edge in about one and a half turns, drawn as a single light stroke (lighter than the player's own color, the same light shade the other light patterns use), clipped to the body like every pattern. Bold enough to read at a player's 36 units across; the outline and the face go on top and stay easy to see.
- It works on all 10 player colors the same way the light patterns do (Bands, Belly, Party, Halves, Diagonal).

## Compared with what exists
| Existing | What it shares | How the new one looks different |
| --- | --- | --- |
| Bands | both are light shapes across the body | the bands are two straight parallel cuts; Lolly is one connected line that turns |
| Spots | both are light or dark marks on the body | the spots are five separate dots; Lolly is a single continuous line that winds |
| Belly | both use a light patch of color | the belly is a solid round fill on the lower body; Lolly is a line, not a fill, and it is centred |
| Party | both are light across the top of the body | the party zigzag sits on the top edge like a hat; Lolly winds through the middle of the body |
| Halves | both paint light over the body | halves lighten a whole half of the body; Lolly is a single swirl line, not a fill at all |
| Diagonal | both are two-part light patterns | diagonal is two straight parallel stripes; Lolly is one curving line that turns around the centre |

## Acceptance criteria
- [ ] The Cosmetics panel shows Lolly at 80 coins, with the preview critter wearing it on the player's own color.
- [ ] Wearing Lolly paints one light lollipop-swirl spiral across the body that reads on any of the 10 player colors, with the outline and face on top and easy to see.
- [ ] Buying it spends 80 coins, it is kept for the next visit, and bots wear it at random like the other patterns.
- [ ] The pattern shelf's price ladder now reads 30, 30, 40, 40, 50, 60, 80.
