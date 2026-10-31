---
id: T0021
title: "First shop stock: two patterns, a face and a back accessory"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T04:17:26Z
claimed_at: 2026-10-31T04:59:39Z
epic: E6
designer: desktop
---

## Goal
The shop has something to sell: two patterns and two accessories with prices, seen on bots the moment they land, ready for the shop panel.

## Details
- Two patterns, each painted over the body in the player's own color, clipped to it (one file each):
  - **Spots** — description "Five dark dots on the body." — price 30. Look: 5 dots, each about a quarter of the body wide, darker than the body color, scattered (two high, two middle, one low); never over the face.
  - **Bands** — description "Two light bands across the body." — price 30. Look: 2 horizontal bands, lighter than the body color, each about a fifth of the body high, one just below the eyes and one across the belly.
  - Both must read on all 10 player colors (that is what darker/lighter is for) and at a player's 36 units across.
- Two accessories (one file each; the head slot stays out of this task — the starter hats are T0017's):
  - **Round Glasses** — description "Round ink frames around the eyes." — slot face, price 80. Look: two ink-outlined circles around the eyes with a small bridge over the nose; it sits over the eyes and never covers them.
  - **Candy Pack** — description "A little green pack on the back." — slot back, price 100. Look: a round green satchel behind the body, about three quarters of the body wide, ink outline, a small yellow buckle; bobs a little with movement; never covers the face or the name.
- No comparison rows are needed: no pattern, face or back accessory exists yet, and this task touches no head item.
- Prices against what a match earns (T0019: a new player about 60–120 coins a match, a good one 150–250): a pattern at 30 is a first-match goal, the glasses at 80 and the pack at 100 take a few matches. Later stock stays in the 25–150 range until a real goal item exists.
- They change nothing in play: no stats, no size, no behavior. Bots wear things at random, so the field shows them the moment they land.

## Acceptance criteria
- [ ] Spots (5 dark dots, 30 coins) and Bands (2 light bands, 30 coins) exist, read on all 10 player colors, and never cover the face.
- [ ] Round Glasses (face, 80 coins) and Candy Pack (back, 100 coins) exist with the looks above; the glasses sit around the eyes, never over them.
- [ ] In a fresh match, within about a minute a bot wearing the glasses and a bot wearing Spots or Bands are visible on the field.
- [ ] Each item has a one-line shop description and a name of at most 18 characters.
- [ ] Nothing in the match changes because of them: no stats, no size, no behavior.
