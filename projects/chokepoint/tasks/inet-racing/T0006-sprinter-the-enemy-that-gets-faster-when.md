---
id: T0006
title: "Sprinter: the enemy that gets faster when hit"
assignee: inet-racing
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-28T01:07:07Z
claimed_at: 2026-10-28T02:21:12Z
designer: desktop
---

## Goal
A new enemy with a behavior no other has: it gets faster every time it is hit, so focusing it is a race — melt it before it takes off.

## Details
- Closest existing: Dart (a fast walker at constant speed). What is new: a speed ramp — every hit makes it permanently faster.
- Shape and size: a small orange chevron (arrow) pointing along the path, the same size as Dart. Distinguishable from Dart at a glance (Dart is its current shape; the Sprinter is the arrow).
- hp: the same as Dot's hp. Kill gold: the same as Dart's. A leak costs 1 life, like all enemies.
- Speed: starts at 90% of Dart's speed. Each hit it takes adds 10% of Dart's speed (of the base, not compounding). Cap: 190% of Dart's speed, reached after 10 hits.
- Feedback: the normal white hit flash, plus two short speed ticks trailing behind it; the ticks grow a little with every speed step, and once the cap is reached they pulse every 0.5s.
- Waves: waves 1-7 unchanged. From wave 8: 2 Sprinters mixed into the wave; +1 at wave 12, +1 at wave 16, +1 at wave 20; capped at 6 per wave.

## Acceptance criteria
- [ ] A Sprinter that has been hit is visibly faster than an unhit Dart (it covers the same road segment in less time).
- [ ] After 10 hits it stops getting faster: its speed no longer changes when hit.
- [ ] Sprinters first appear in wave 8; waves 1-7 contain none.
- [ ] The orange chevron reads as a new enemy (shape differs from Dart and Dot) at 412x915 and 1280x720.
- [ ] Killing one pays Dart's gold and counts as a stop like any enemy.
