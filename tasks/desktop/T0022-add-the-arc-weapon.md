---
id: T0022
title: Add the Arc weapon
assignee: desktop
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-26T20:18:38Z
---

## Goal
A new weapon: an ink arc that snaps from you toward your aim and chains between nearby enemies — a fast, close-range answer to swarms (Motes, Splinters) that Point and Line plow through too slowly.

## Details
- New weapon "Arc", unlocked the same way as Line and Orbit: a level-up card grants it, and it fires alongside your other owned weapons (there is no weapon switching — everything you own is active at once).
- While owned: every 0.9 s an ink arc snaps from the player toward the aim direction. It hits the first enemy in the aim direction within 260 units, then jumps to the nearest other enemy within 140 units of the enemy it just hit, and so on — up to 3 jumps, so one arc can hit up to 4 enemies. An enemy is hit at most once per arc.
- Each hit deals 16 damage (scales with the damage stat like all weapon damage) and small knockback (40, on the same scale as Line).
- Look: a jagged ink polyline (2–3 zigzag segments per jump) from the player through each chained enemy, fading out over 200 ms. Ink color. It must not hide the player or the shards.
- Sound: reuse the existing shoot SFX on fire.
- New upgrade in `UPGRADES` (same shape as the Line and Orbit entries): `id: 'arc'`, `name: 'Arc'`, `description: 'New weapon: an ink arc that chains between nearby enemies'`, `maxLevel: 1`, `weight: 5`, `color: PALETTE.ink`.

## Acceptance criteria
- [ ] The level-up menu offers the Arc upgrade once; picking it makes the player fire ink arcs alongside Point and Line
- [ ] Each arc hits the first enemy in the aim direction within 260 units for 16 damage, then chains to up to 3 more enemies within 140 units of the previous hit, 16 damage each, each enemy at most once per arc
- [ ] Arcs fire every 0.9 s; a jagged ink line flashes from the player through the chained enemies and fades in about 200 ms
- [ ] Enemies killed by the arc drop shards and play the normal death sound; Point and Line behavior is unchanged
- [ ] `npm run check` and `npm run smoke` pass
