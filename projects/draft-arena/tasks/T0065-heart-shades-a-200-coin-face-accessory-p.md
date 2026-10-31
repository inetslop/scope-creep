---
id: T0065
title: "Heart Shades: a 200-coin face accessory, pink heart frames around the eyes"
size: S
priority: 3
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T12:00:08Z
claimed_at: 2026-10-31T12:24:29Z
designer: yoga
---

## Goal
The shop's face shelf (its thinnest: 3 items) gets its mid-tier item: a 200-coin pair of pink heart frames, a saving goal between the 100-coin Beak and the 300-coin Chef Hat.

## Details
A new file in src/content/accessories/ (closest example: src/content/accessories/round-glasses.ts, the other face item drawn at the eyes), registered in the accessories index:
- name: "Heart Shades", description: "Pink heart frames around the eyes.", slot: face, price: 200, no prestige.
- Look: two pink hearts with ink outlines as frames around the eyes — outline only, the eyes stay visible through them, with a short ink bridge between the two at the nose. A little bounce with the critter's bob, nothing more. It sits at the eyes, where Round Glasses sits, and never covers them.
- The shop, the start screen and the bot wearing pick it up from the registry with no other edits; it changes nothing in play.

## Compared with what exists (face accessories)
| Existing | What it shares | How the new one looks different (not a recolor) |
| --- | --- | --- |
| Round Glasses | frames around the eyes | thin round ink frames, one plain circle each; Heart Shades is two chunky pink hearts, colored and shaped |
| Bow Tie | a face item in one candy color | a red bow at the mouth, below the eyes; Heart Shades sits at the eyes and reads as two hearts from across the field |
| Beak | a small solid item below the eyes | one solid orange triangle at the mouth line; Heart Shades is two outlined pink hearts around the eyes |

## Acceptance criteria
- [ ] The shop's face row shows a mini-critter wearing the pink heart frames, priced 200; buying it spends 200 coins and the critter still wears them on the next visit.
- [ ] In a match, a critter wearing them shows two pink heart outlines around the eyes, eyes and mouth still visible, readable at a player's size in a crowd.
- [ ] Bots sometimes wear them in a match.
- [ ] No new start-screen card: the shop the coin line already opens lists it.
