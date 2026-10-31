---
id: T0089
title: "The third shelf: a 120-coin Feather for the head, a 300-coin Candy Cane for the back"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T15:05:01Z
epic: E21
---

## Goal
After the free hats the head slot is quiet until the 150-coin Bloom and the 300-coin Chef Hat, and the back jumps from the 180-coin Party Blower straight to the 400-coin Medal. Two middle steps give both slots a next save to work toward, in the shop's price ladder.

## Details
Two new accessories in src/content/accessories/ (closest existing examples: `bloom.ts` for the head item, `party-blower.ts` for the back item), each registered in the accessories index exactly like the others. Both change nothing in play.

1. **Feather** (`feather`), slot head, 120 coins, no prestige. Description: "A single pink feather resting on the head." One pink feather leaf, tilted about 30 degrees, resting on the top of the head: a rounded leaf shape with a small ink quill line down its middle, ink outline, a little bounce with movement. It never covers the eyes and reaches at most one radius above the head, where the player's name sits.
2. **Candy Cane** (`candy-cane`), slot back, 300 coins, no prestige. Description: "A red and white striped cane hooked over the back." A candy cane resting over the back: a curved cane with the hook up over one shoulder, alternating red and white stripes, ink outline, a small sway with movement.

The prices sit in the ladders: the head slot then reads free, free, 120, 150, 300, and the back slot reads 100, 120, 180, 300, 400.

## Compared with what exists
| Existing | What it shares | How the new one looks different (not a recolor) |
| --- | --- | --- |
| Chef Hat | both sit on the head | the chef hat is a tall white puff that fills the top of the head; the feather is one thin tilted pink leaf to the side, the head still showing |
| Cone | both are headwear | the cone is a solid yellow triangle with a red tip; the feather is a soft pink leaf, open and tilted, not a cone |
| Beanie | both cover the top of the head | the beanie is a purple dome with a pink pom over the whole head; the feather is a single leaf resting on top, not a dome |
| Bloom | both are on the head | the bloom is a five-petal pink flower with a yellow centre; the feather is one leaf with a quill line — no petals, no centre |
| Candy Pack | both sit on the back | the pack is a small green square; the cane is a long curved striped hook, not a box |
| Medal | both hang on the back | the medal is a yellow disc with a red ribbon; the cane is striped red and white, curved with a hook, and leans over the shoulder |
| Balloon | both bob on the back | the balloon is a round yellow balloon on a string; the cane is striped and rigid with a hook, no string |
| Party Blower | both are red party things on the back | the blower is a red roll on a stick; the cane is one continuous curved hook with red and white stripes, no stick |

## Acceptance criteria
- [ ] The Cosmetics panel shows the Feather at 120 coins (head) and the Candy Cane at 300 coins (back), with the preview critter wearing each when pointed at.
- [ ] A Feather-wearing player shows the tilted pink feather on the head in a crowd with the eyes clear; a Candy Cane-wearing player shows the striped cane hooked over the back.
- [ ] Both can be bought, worn and taken off like the other accessories, are kept for the next visit, and bots wear them at random.
- [ ] The shop's head ladder reads 0, 0, 120, 150, 300 and the back ladder reads 100, 120, 180, 300, 400.
