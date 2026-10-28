---
id: T0004
title: "Lance: a piercing line augment"
assignee: desktop
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-28T01:07:07Z
claimed_at: 2026-10-28T01:39:12Z
designer: desktop
---

## Goal
A new augment with an attack no tower has: a thin shot that keeps going after a hit and strikes more enemies in its line.

## Details
- New augment, closest existing: Bolt (straight single-target shot). What is new: piercing — the shot passes through enemies instead of stopping at the first one.
- As a tower's first augment: "Lance — a long thin shot, 12 damage every 0.9s, hits one more enemy beyond." A thin straight tracer (teal, ~2px wide) with the normal hit flash. Targeting is the same as Bolt's (furthest along).
- When added to a tower: "Added: +1 pierce" — the tower's shots pass through one more enemy after the first hit. It combines with every first augment:
  - Bolt + Lance: shots hit 2 in a line
  - Reach + Lance: a piercing sniper, 2 in a line
  - Rapid + Lance: needles each pass through 1 more enemy
  - Splash + Lance: the shot passes through 1 more enemy before it bursts
  - Frost + Lance: a slowing shot that hits 1 more enemy
- Tiers (E4, T0002): Common 12 damage / 0.9s / pierce 1; Rare 16 / 0.77s / pierce 2; Epic 20 / 0.63s / pierce 3. If the rarity system has not landed when this is built, the Common values are the live ones and Rare/Epic are stored in the augment's data for it to read later.
- On the tower: a long thin teal rod barrel (about 2x the length of a standard barrel, about 1/3 of its width) that points at the target. If teal is already used by another augment, use green instead.
- Draft card lines (Common): "Lance — a long thin shot, 12 damage every 0.9s, hits one more enemy beyond." / "Added: +1 pierce."

## Acceptance criteria
- [ ] A lone Lance tower in a line of 3 Dots takes the line down with a single shot hitting 2 (the target and the one beyond).
- [ ] A Bolt tower with Lance in a second slot hits 2 enemies in a line per shot.
- [ ] The draft offers Lance with both card lines; a tower with it shows the long thin rod.
- [ ] Pierced enemies take the full damage each (3 Dots in a line: 2 die, the third takes no hit from that shot).
- [ ] The rod barrel is visible at 1x zoom at 412x915 and does not overlap the board's road.
