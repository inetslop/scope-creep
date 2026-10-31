---
id: T0035
title: "Chef Hat: a 300-coin head accessory, the top of the shop"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T06:50:30Z
epic: E6
---

## Goal
The shop's first long goal: a hat that takes many matches to save up for, so the coins a player earns across lives are worth playing for (the "prices span" bar in planning/modules/shop.md: cheap things, middle ones, and goals that take many matches).

## Details
- New accessory file `src/content/accessories/chef-hat.ts`, registered in `src/content/accessories/index.ts`. Closest example: `src/content/accessories/round-glasses.ts` (T0021).
- Name: "Chef Hat". Slot: head. Price: 300 coins. No prestige requirement. Description: "A tall white puff on the head."
- Look: a tall white puff — three stacked bumps, each with an ink outline, reaching about 16 units above the top of the head (at most one radius of the player's head, leaving room for the name) — with a thin ink band at its base. It sits straight on the head, bobs a little with the critter, and never covers the eyes. White like the HUD's sticker cards, ink outlines, no glow, no themed dressing.
- It changes nothing in play: no stats, no size change; bots wear it at random like every other accessory.
- The two starter hats from T0017 (in progress) are the only other head items: at design time check them in `src/content/accessories/` and keep the puff clearly distinct from both — a light, cloud-shaped silhouette against two simple hats. If either starter hat is itself a light puffy hat, flag this task instead of building a copy.
- Priced against what a match earns: 1 coin per monster kill and the victim's level per knockout (T0019), plus 1 coin per event gem (T0027), give a 5-minute match of a new player roughly 30–60 coins and a good player 60–100. 300 is about 3–6 matches. Against the rest of the stock (patterns 30, Round Glasses 80, Candy Pack 100) it is 3x the current top and the first item that needs saving.

## Compared with what exists

The head slot is empty in the game today; the only head items are the two starter hats T0017 is building.

| Existing | What it shares | How the new one looks different (not a recolor) |
| --- | --- | --- |
| the two starter hats from T0017 (in src/content/accessories/) | a simple silhouette on the head | a tall white puff: three stacked ink-outlined bumps about 16 units above the head with an ink band at the base — a light cloud silhouette, distinct in shape and color from both starter hats (verify against them at design time) |

## Acceptance criteria
- [ ] The accessories registry includes a "Chef Hat": head slot, 300 coins, description "A tall white puff on the head."
- [ ] On the critter (preview and in the match) it draws as a tall white puff of three bumps with an ink band at the base, about 16 units above the head, bobbing a little and never covering the eyes.
- [ ] It can be bought, worn and taken off like Round Glasses, and shows on bots at random.
- [ ] It changes nothing in play: no stats, no size, and the player's name still sits above it.
