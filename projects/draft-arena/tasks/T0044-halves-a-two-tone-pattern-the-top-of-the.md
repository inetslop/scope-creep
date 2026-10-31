---
id: T0044
title: "Halves: a two-tone pattern, the top of the body lighter"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T08:05:11Z
claimed_at: 2026-10-31T08:32:17Z
epic: E6
designer: yoga
---

## Goal
A third price step in the shop's patterns: a two-tone critter that reads at a glance in a crowd.

## Details
- New pattern file src/content/patterns/halves.ts (one file, drawn like src/content/patterns/belly.ts — the closest example, also a light shape on the body), registered in src/content/patterns/index.ts with the other patterns.
- Name: Halves. Description: "The top half of the body, lighter, like a two-tone critter." Price: 50 coins, no prestige gate.
- How it looks: the top half of the body, painted lighter than the player's own color (the same light shade the other light patterns use), clipped to the body with a straight cut across the middle; the outline and the face go on top, as with every pattern. One bold cut, no fine detail.
- It must read on all 10 player colors and at a player's size (36 units across).
- Price against what a match earns: a match pays 1 coin per monster kill, the victim's level per player knockout and 1 per event gem, so a few coins a match — 50 coins is a few matches, between the 40-coin patterns and the 80-coin accessories.
- The shop picks it up from the pattern registry: it shows in the shop's pattern row at its 50-coin price; buying, wearing and taking it off work exactly as with the other patterns, and a bought Halves is kept in the profile for the next visit.
- Counts: 5 of the 12 patterns.

## Acceptance criteria
- [ ] The shop's pattern row shows Halves at 50 coins with its description; a player who can afford it buys it, and it is still owned on the next visit.
- [ ] Wearing Halves paints the top half of the player's body lighter than its own color, with a straight cut across the middle, on every one of the 10 player colors, outline and face on top.
- [ ] Bots wear Halves at random with the other patterns, seen in the match.
- [ ] It reads at a glance on a critter of 36 units in a crowd: one bold two-tone split, distinct from the bands, the spots, the belly patch and the party zigzag.

## Compared with what exists
| Existing | What it shares | How the new one looks different |
| --- | --- | --- |
| Bands | light shapes across the body | two thin bands across the whole body; Halves is one bold cut that paints the entire top half |
| Spots | shapes in the player's own color | five separate dots; Halves is one continuous half, not dots |
| Belly | a light patch on the body | a small round patch on the lower body; Halves is the whole top half, a straight cut, the opposite placement |
| Party | light shapes near the top | a zigzag line across the top; Halves is a solid filled half, not a line |
