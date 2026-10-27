---
id: T0136
title: The Fresco weapon — the trail you leave bites
assignee: inet-racing
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T18:14:35Z
claimed_at: 2026-10-27T18:56:05Z
designer: desktop
---

## Goal
A new standing weapon that turns movement into the weapon: while you move you lay a 40-unit ink trail on the page, and enemies that cross it take a bite — kiting, which today is only escape, becomes attack.

## Details
- New level-up card, a new-weapon card in the same style as the Orbit/Arc cards (ink, weight 4, maxLevel 1): "New weapon: a Fresco — while you move, you leave a 40-unit ink trail that bites enemies that cross it."
- The pool: the card takes the pool slot of Draft (the +25% projectile-speed card), which this task retires — Draft is removed from the pool, is never offered again and is never drawn by Warm Start (T0114); the pool stays at 16. T0119 is retiring Momentum in the same window; the two tasks retire different cards and land in either order.
- A standing weapon like the Orbit: no volleys, the Point keeps firing normally.
- The trail: while the player is actually moving (any direction), a flat ink patch is stamped every 40 ms at the player's position — 40 u wide, 18 u long, aligned with the direction of travel, alpha 40% fading linearly to 0 over its 2.0 s life. Standing still stamps nothing; existing patches keep fading, so the trail is fully gone 2.0 s after the player stops.
- Pooled: at most 50 live patches (a full 2.0 s at 40 ms), oldest recycled; drawn under the entities on the same layer as the puddles (T0111) and the enemy trails (T0126).
- Damage: an enemy or elite first overlapping a patch takes 10 damage — once per enemy per patch (re-crossing the same patch is free; a new patch bites again) — with the normal hit flash and damage number. The bite scales with the player's damage stat and rolls crits like a weapon hit, so Underexposure (T0105) and Contrast apply. Bosses, their parts and enemy bullets are untouched by the trail.
- The trail is on the paper: it is not pushed by the Platen's slams (T0091), it interacts with no hazard, and it is stamped at the player's position (always inside the safe rect) so the Crop (T0045) and Tide (T0127) need no special-casing.
- No new key, HUD element, SFX or scene.

## Acceptance criteria
- [ ] Level-up offers include the Fresco card in ink style; after the change, Draft is never offered, never drawn by Warm Start, and the pool contains 16 cards.
- [ ] While moving, a flat ink trail about 2 s long (40 u wide) fades behind the player; while standing still nothing new is stamped and the trail is gone within 2 s.
- [ ] An enemy crossing a trail patch takes 10 damage once, with the hit flash and damage number; the same enemy crossing the same patch a second time takes no more, a fresh patch re-damages it; crits and Underexposure apply to bites.
- [ ] The Point still fires normally while Fresco is owned; bosses and enemy bullets are untouched by the trail; no new key, HUD element, sound or scene.
