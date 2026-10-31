---
id: T0091
title: "Monocle: a 150-coin face accessory, a gold lens over one eye"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T15:16:30Z
epic: E21
---

## Goal
The face slot — the shop's thinnest shelf — gets its middle step: one gold lens over one eye with a chain to the cheek, so a player with a few lives has a next save between the 100-coin Beak and the 200-coin Heart Shades.

## Details
- A new accessory "Monocle" in src/content/accessories/ (closest examples: round-glasses.ts — a frame around the eyes; heart-shades.ts — a colored frame). One new file plus one registry line in the accessories index.
- slot: face, price 150, no prestige. description: "A gold lens over one eye, with a thin chain to the cheek."
- How it looks: a yellow ring (the palette yellow, used as it is) around the critter's right eye, the same ring weight as the Round Glasses frames, with an ink outline; the center of the ring is clear, so the eye stays visible; a thin ink chain runs from the lens rim down the cheek and ends in a small ink dot; the chain sways a little with the critter's movement (at most a little bounce).
- It never covers the eye, never reaches beyond the face, and changes nothing in play: no stats, no size.
- Price: 150 coins — the face slot's step between the 100-coin Beak and the 200-coin Heart Shades, priced against what a match earns like the other middle items.

## Acceptance criteria
- [ ] The Cosmetics panel sells a "Monocle" face item at 150 coins, listed between the Beak (100) and the Heart Shades (200); a player can buy it, wear it, take it off, and it is still worn on the next visit.
- [ ] A critter wearing it shows one yellow ring around one eye (clear center, the eye visible) and a thin ink chain to the cheek; it reads at a glance on a critter in a crowd.
- [ ] The shop's preview critter wears it when it is pointed at, like the other face items.
- [ ] It changes nothing in play: the wearer's stats and size are unchanged, and the eye and the name above the head stay visible.

## Compared with what exists
| Existing | What it shares | How the new one looks different (not a recolor) |
| --- | --- | --- |
| Round Glasses | frames around the eyes | the glasses are two ink rings around both eyes; the Monocle is one yellow ring around one eye only, with a chain that hangs to the cheek |
| Heart Shades | frames around the eyes | the shades are two pink hearts over both eyes; the Monocle is one round yellow lens over one eye, with no second lens and no heart shape |
| Beak | sits on the face, below the eyes | the beak is a solid orange triangle below the eyes; the Monocle is a clear ring around one eye — a circle, not a triangle, over the eye, not below it |
| Bow Tie | sits at the mouth | the bow is two red triangles at the mouth; the Monocle is up at one eye, a ring with a hanging chain, not a bow at the mouth |
