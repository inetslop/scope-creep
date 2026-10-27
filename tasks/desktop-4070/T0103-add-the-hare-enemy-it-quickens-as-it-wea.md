---
id: T0103
title: Add the Hare enemy — it quickens as it weakens
assignee: desktop-4070
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T10:47:29Z
---

## Goal
A new enemy that rewards burst damage instead of chip damage: the Hare is a small green circle that starts sluggish and runs faster every quarter of its HP it loses, so the kill you are chasing gets quicker the longer it survives.

## Details
- New enemy in its own content data file, a sibling of the existing `src/content/enemies/*.ts` files (closest examples: the Dart and Wedge chasers). Register it in the spawn roster like every other director-spawnable enemy.
- Shape and look: small green circle (PALETTE.green), radius 12, no spin.
- Stats: 24 hp, 8 contact damage, 2 XP, threat 2, spawn weight 4, `unlockAtSec` 100 (first possible at 1:40), knockbackResist 0.1.
- Movement: `chase` — it runs straight at the player (like the Wedge), but its speed is not fixed. It starts slow and quickens in four steps as it takes damage:
  - Speed = 40 × 1.3^n, where n is the number of full 25%-of-max-HP steps it has lost (n = 0, 1, 2, 3, capped at 3).
  - So: 40 u/s at full HP → 52 after it loses a quarter → 67.6 after two quarters → 87.9 after three quarters (its top speed, reached at 25% HP and below, including 1 hp).
  - The step-up is the new behavior: no existing enemy changes its own speed based on the damage it has taken — the wounded Hare is the fast one.
- Closest existing enemy: the Wedge (a straight-line chaser). What is new: the Wedge's speed never changes; the Hare's speed rises in four steps (40 / 52 / 67.6 / 87.9) as its HP crosses below 75% / 50% / 25% of max.
- Marginalia: on its first sighting in a run, the dry note "QUICKER AS IT WEAKENS" fades in beside it, like every other new enemy type.
- Keep the speed rule in a pure function (unit-tested) that maps HP-fraction → speed, so the four steps are locked to the numbers above.
- The enemy pool moves from 7/10 to 8/10 — no existing enemy is removed or changed.

## Acceptance criteria
- [ ] No Hare spawns before 1:40; at and after 100 s it can spawn as a small green circle.
- [ ] A full-health Hare chases at a sluggish 40 u/s; as it drops to 75% / 50% / 25% of max HP its chase speed steps up to 52 / 67.6 / 87.9 u/s — visibly harder to lose the longer it lives.
- [ ] Its first sighting in a run prints the marginalia "QUICKER AS IT WEAKENS."
- [ ] It deals 8 contact damage and is worth 2 XP; on death it shatters into fragments and drops shards like any other enemy.
- [ ] A unit test pins the speed to HP fraction: 40 while above 75% max HP, 52 at 75% down to above 50%, 67.6 at 50% down to above 25%, and 87.9 at 25% and below (reached while it still has 1 hp).
