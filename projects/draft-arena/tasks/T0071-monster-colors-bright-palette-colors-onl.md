---
id: T0071
title: "Monster colors: bright palette colors only, and no two monsters alike"
size: M
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-10-31T12:51:01Z
---

## Goal
Every monster reads apart at a glance, in the game's bright candy colors. Today the Sleeper is a darkened pink that looks muddy next to everything else, and the Flee is a red circle like the Dot.

## Details
- A monster's body is a palette color as it is: never `shade(color, -x)` or any other darkened version.
- Sleeper: from its darkened pink to a bright warm color that no other monster uses.
- Flee: no longer red; a bright warm color that no other monster uses. Keep its shape, nose and faces.
- Once the Snail, Popper and Boing are gone (their removal is its own task) the monsters are Dot (red circle), Puff (purple pentagon), Zippy (pink triangle), Spitter (orange diamond), Sleeper (square) and Flee (circle with a nose). Four warm colors (red, orange, purple, pink) aren't enough for six: add warm candy colors to PALETTE, as light and bright as red, orange, purple and pink (not darker, and not yellow or green: those are rewards), and give every monster its own color.
- Anything drawn in a monster's color (its shots, its areas) follows it.

## Acceptance criteria
- [ ] No monster's body color is darkened: `grep -n "shade(" src/content/monsters/` finds no body color.
- [ ] Dot, Puff, Zippy, Spitter, Sleeper and Flee have six different colors, all from PALETTE.
- [ ] The Sleeper and the Flee look as bright as the Dot next to them.
