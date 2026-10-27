---
id: T0055
title: Add the Counterpoint weapon
assignee: desktop-4070
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T00:59:33Z
claimed_at: 2026-10-27T01:31:33Z
designer: desktop
---

## Goal
A new weapon for players who like to keep their ink in play: Counterpoint fires a point that bounces off the arena walls, so you can punish corners and the edges without re-aiming.

## Details
- New weapon "Counterpoint", unlocked the same way as Line, Orbit and Arc: a level-up card grants it, and it fires alongside your other owned weapons (there is no weapon switching — everything you own is active at once). Model the content file on the existing Point weapon (`src/content/weapons/point.ts`).
- While owned: every 0.8 s it fires one ink point toward your aim. Look: a small ink circle (radius 5), the same look as the Point projectile.
- Projectile values: speed 260 units/s, base damage 14 (scales with the damage stat and crits like all weapon damage), pierce 0, knockback 40, max lifetime 3 s.
- The bounce: when the point reaches an arena wall it reflects at the mirror angle (angle of incidence = angle of reflection) and keeps going. It may bounce at most 2 times. On each bounce its damage is multiplied by 0.75 (so 14 → 10.5 after one bounce, ≈7.9 after two). If it touches a wall a third time it is destroyed — it never bounces a third time. It also dies on an enemy hit (like a normal projectile) or when its 3 s lifetime expires, whichever comes first.
- Sound: reuse the existing shoot SFX on fire and the existing hit SFX on each wall bounce, so bounces are audible.
- New upgrade in `UPGRADES` (same shape as the Line/Orbit/Arc entries, appended at the end of the array): `id: 'counterpoint'`, `name: 'Counterpoint'`, `description: 'New weapon: a point that bounces off the arena walls'`, `maxLevel: 1`, `weight: 5`, `color: PALETTE.ink`, grants the counterpoint weapon.

## Acceptance criteria
- [ ] The level-up menu offers the Counterpoint card once; picking it makes the player fire Counterpoint points alongside Point, Line, Orbit and Arc
- [ ] Counterpoint fires one ink point every 0.8 s toward your aim at speed 260 for 14 base damage
- [ ] A point that reaches a wall reflects at the mirror angle and, on its next enemy hit, deals 75% of its pre-bounce damage (14 → 10.5 after one bounce, ≈7.9 after two)
- [ ] After two bounces the next wall contact destroys the point (it never bounces a third time); points also die on an enemy hit or after 3 s
- [ ] Each wall bounce plays the existing hit SFX; kills drop shards and play the normal death sound; Point/Line/Orbit/Arc behavior is unchanged
- [ ] `npm run check` and `npm run smoke` pass
