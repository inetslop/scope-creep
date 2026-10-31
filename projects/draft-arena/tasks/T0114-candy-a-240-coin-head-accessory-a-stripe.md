---
id: T0114
title: "Candy: a 240-coin head accessory, a striped candy on the side of the head"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T19:06:11Z
epic: E26
---

## Goal
The head shelf's missing middle step between the 150-coin Bloom and the 300-coin Chef Hat: a candy with its own silhouette that reads on a critter in a crowd.

## Details
- New head accessory **Candy** (`src/content/accessories/candy.ts`), slot head, 240 coins, no prestige.
- Description (one line, under 70 characters): "A striped orange and white candy on the side of the head."
- Look: a horizontal ellipse (about 0.7 radii wide, 0.45 radii tall) resting on the side of the head at ear height, ink outlined; an orange body with three white vertical stripes; two small white wrapper twists (little triangle fans) at its left end; a small white shine; a gentle bob (about 0.05 radii over 3 s — slower and smaller than the Balloon's). It never covers the eyes and stays below the top of the head, clear of the player's name.
- Model it on `src/content/accessories/bloom.ts` (a head item drawn in palette colors with ink outlines and a light bob); register it in `src/content/accessories/index.ts` with one import and one registry line between Bloom (150) and Chef Hat (300), keeping the shelf's price order.
- Price: 240 coins — the step between Bloom (150) and the Chef Hat (300); the head ladder reads 120, 150, 240, 300, 450.
- Add `tests/candy.test.ts` mirroring `tests/lollipop.test.ts`: head slot, 240 coins, no prestige lock.

## Compared with what exists

| Existing | What it shares | How the new one looks different (not a recolor) |
| --- | --- | --- |
| Cone | sits on the head | a wide striped ellipse with wrapper twists on the side, not a tall cone on top |
| Beanie | sits on the head | a hard striped candy ellipse, not a soft dome with a pom |
| Feather | a small item resting on the head | a wide ellipse with two twists, not a single leaf |
| Bloom | a round item on the head | a striped ellipse with wrapper twists, not a flower of petals |
| Chef Hat | sits on the head | a low, wide candy on the side, not a tall puff on top |
| Cherry | a small candy on the head | a striped ellipse with wrapper twists on the side, not a round ball with a stem |

## Acceptance criteria
- [ ] The Cosmetics panel lists Candy at 240 coins with no prestige lock; buying and wearing works and is kept for the next visit.
- [ ] Worn, it shows the striped orange-and-white ellipse with its two white wrapper twists on the side of the head, ink outlined, bobbing gently; the eyes stay clear and nothing rises above the top of the head.
- [ ] The preview critter wears it in the panel, and bots that own it show it in the match.
- [ ] Nothing in play changes: no stat, no size, no hitbox difference for a critter wearing it.
