---
id: T0101
title: "Cherry: a 450-coin head accessory, a red cherry with a green stem"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T17:06:34Z
epic: E22
---

## Goal
The head slot gets its top item — the shop's first head long goal: a red cherry on the head, buyable only after a prestige in all, so the shop's ladders reach past the 300-coin Chef Hat.

## Details
- A new head accessory in the Cosmetics panel: name "Cherry", slot head, price 450, prestige 1 (buyable only after 1 prestige in all, like the Medal's "Needs 2 prestiges in all"), description "A red cherry with a green stem on the head. Needs 1 prestige in all."
- How it looks: a small red ball (a cherry, roughly one quarter of the head's width) resting on top of the head, slightly off-centre; a short green stem curves up out of the top of the ball; one small white shine on the ball; ink outline on ball and stem; at most a gentle bounce with the critter. The head stays visible underneath, the eyes are never covered, and nothing reaches more than one radius above the head (the name sits above that).
- A new file `src/content/accessories/cherry.ts`, modelled on the closest existing file `src/content/accessories/bloom.ts` (a single thing resting on the head), plus one import and one line in `src/content/accessories/index.ts` after the chef-hat line, so the head row reads 0, 0, 120, 150, 300, 450 and stays price-ascending in the shop.
- It changes nothing in play: no stats, no size, no HUD. Buying, wearing, persistence and bot dressing come from the generic accessories iteration.

## Compared with what exists
| Existing | What it shares | How the new one looks different (not a recolor) |
| --- | --- | --- |
| Cone | sits on the head | a yellow party cone with a red tip; the Cherry is a small round ball with a green stem, the head shape stays visible |
| Beanie | on the head | a purple dome that covers the top of the head with a pink pom; the Cherry is a small ball resting on the head, no dome |
| Feather | a single thing resting on the head | a pink leaf with a quill line; the Cherry is a round red ball with a curved stem, no leaf shape |
| Bloom | a single thing on the head | five pink petals around a yellow centre; the Cherry is one ball plus a stem, no petals |
| Chef Hat | sits on the head | a tall white puff that covers the head; the Cherry is small, round and low, the head is still the hat's base |

## Acceptance criteria
- [ ] The Cosmetics panel's head row shows the Cherry last at 450 coins; before the profile has 1 prestige in all it is stamped "Needs 1 prestige in all" and can't be bought, and after it, it buys for 450 coins.
- [ ] Worn, the player's critter in the match shows the red cherry with the green stem on the head: the eyes stay clear, the name above the head is not covered, and bots can wear it at random.
- [ ] Buying, wearing and taking it off are kept for the next visit, and it changes nothing in play.
