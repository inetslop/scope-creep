---
id: T0026
title: "Medal: a back accessory, buyable only after 2 prestiges in all"
size: S
priority: 2
status: design
depends_on: [T0022]
attempts: 0
created: 2026-10-31T05:24:06Z
epic: E7
---

## Goal
The shop's longest goal: a small medal only buyable after 2 prestiges in all — the wearable that marks a returning player on the field, the prestige reward you can wear.

## Details
- One new accessory, its own file in src/content/accessories/, slot **back**: **Medal** — description "A yellow medal with a red ribbon. Needs 2 prestiges in all." — price 400, `prestige: 2` (bought only after 2 prestiges in all, the profile's count across all lives).
- Look — the back slot draws behind the body, so only what sticks out beyond the body's outline reads, and it stays below the body's centre so it never touches the name: a yellow disc, 0.55 of the body's radius, centred 1.2 radii below the body's centre, so a wide crescent of it reads below the critter; ink outline, a small white shine dot at its upper left; two short red ribbon tails peeking from behind the body at the lower left and lower right (about 0.4 radii out from the bottom centre). It sways a little with movement, the way the Candy Pack bobs. Candy colors, ink outline, no glow, no themed dressing.
- Price against what a match earns (T0019: a new player about 60–120 a match, a good one 150–250; the first stock is 30–100): 400 is about two to three good matches on top of the two prestiges — the longest goal in the shop.
- It changes nothing in play: no stats, no size. Bots have no prestiges, so bots never wear it — anyone who wears the Medal has prestiged at least twice in all, and the field marks its own regulars.
- In the shop panel (T0022) it sits with the other back items: before 2 prestiges in all it shows "Needs 2 prestiges" and cannot be bought; after, it is 400 coins. This task only adds the item; the panel and buying are T0022's.

## Compared with what exists
By the time this is designed the back slot has the Candy Pack (T0021, via T0022); if any more back item exists then, add a row for it too.
| Existing | What it shares | How the new one looks different (not a recolor) |
| --- | --- | --- |
| Candy Pack | a back item behind the body, a round thing below the centre | the pack is a wide green satchel (three quarters of the body wide) with a yellow buckle; the medal is a narrow yellow disc at the bottom centre with two red ribbon tips — a different shape, a different color, and the ribbon tells it apart at a glance |

## Acceptance criteria
- [ ] The Medal exists: slot back, 400 coins, prestige 2, a name of at most 18 characters and a one-line description.
- [ ] In the shop panel, a player with fewer than 2 prestiges in all sees "Needs 2 prestiges" on it and cannot buy it; after 2 prestiges in all it can be bought for 400 coins and, once bought, worn and taken off like the other back items.
- [ ] Worn, it reads on a 36-unit critter in a crowd: a yellow disc below the body with two red ribbon tips; it never covers the face or the name and changes nothing in play (hp, speed, radius and pickup are the same with and without it).
- [ ] No bot wears it in a fresh match.
- [ ] A bought medal is still owned on the next visit in the same browser.
