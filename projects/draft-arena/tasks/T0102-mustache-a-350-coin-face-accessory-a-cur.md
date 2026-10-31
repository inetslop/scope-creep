---
id: T0102
title: "Mustache: a 350-coin face accessory, a curly pink mustache over the mouth"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T17:06:34Z
epic: E22
---

## Goal
The face slot gets its top item — the top of the thinnest ladder (80, 80, 100, 150, 200): a curly pink mustache, buyable only after a prestige in all, so a veteran face has a long goal past the 200-coin Heart Shades.

## Details
- A new face accessory in the Cosmetics panel: name "Mustache", slot face, price 350, prestige 1 (buyable only after 1 prestige in all, like the Medal's "Needs 2 prestiges in all"), description "A curly pink mustache over the mouth. Needs 1 prestige in all."
- How it looks: two pink curls meeting in the middle below the nose, sitting over the mouth with the mouth still visible beneath; each curl sweeps out to the side and hooks slightly up at the outer end; ink outline; at most a tiny sway with the critter. It reads as one bold horizontal shape at a player's size (36 units across), and it never covers the eyes.
- A new file `src/content/accessories/mustache.ts`, modelled on the closest existing file `src/content/accessories/bow-tie.ts` (a small thing at the mouth), plus one import and one line in `src/content/accessories/index.ts` after the heart-shades line, so the face row reads 80, 80, 100, 150, 200, 350 and stays price-ascending in the shop.
- It changes nothing in play: no stats, no size, no HUD. Buying, wearing, persistence and bot dressing come from the generic accessories iteration.

## Compared with what exists
| Existing | What it shares | How the new one looks different (not a recolor) |
| --- | --- | --- |
| Round Glasses | a face item | ink frames around the eyes; the Mustache sits at the mouth, pink, no frames |
| Bow Tie | at the mouth | a red bow tied below the mouth; the Mustache sits above the mouth, two hooks, no ribbon |
| Beak | below the eyes | one orange triangle at face centre; the Mustache is two wide pink curls across the mouth |
| Monocle | over one eye | a gold lens over the right eye with a chain to the cheek; the Mustache is symmetric, at the mouth, no lens |
| Heart Shades | around the eyes | two pink heart frames around the eyes; the Mustache is at the mouth, nothing around the eyes |

## Acceptance criteria
- [ ] The Cosmetics panel's face row shows the Mustache last at 350 coins; before the profile has 1 prestige in all it is stamped "Needs 1 prestige in all" and can't be bought, and after it, it buys for 350 coins.
- [ ] Worn, the player's critter in the match shows the pink mustache over the mouth: the mouth stays visible beneath it, the eyes stay clear, and bots can wear it at random.
- [ ] Buying, wearing and taking it off are kept for the next visit, and it changes nothing in play.
