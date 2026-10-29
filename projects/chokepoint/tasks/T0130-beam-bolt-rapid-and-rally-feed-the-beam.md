---
id: T0130
title: "Beam combos I: Bolt adds a ray, Rapid and Rally feed the beam"
size: M
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T10:40:00Z
claimed_at: 2026-10-29T11:00:19Z
epic: E4
designer: baby-mama
---

## Goal
A tower with Beam as its first augment ignores almost every augment added to it today: Bolt, Rapid and Rally do nothing, so building onto a Beam tower is a wasted slot. Make the attack-strength augments change the beam the way a player expects from their card lines, starting with the most obvious one: Bolt gives the beam another ray.

## Details
Applies to a tower whose **first** augment is Beam (the beam tower). Beam added to other towers is unchanged.
- **Bolt added ("One more shot each attack"):** +1 ray per Bolt. Each extra ray is a full beam at the tower's beam rate (6/8/10 per second by the Beam's tier), locked on the next enemy furthest along in range that no other ray of this tower holds (ray 1 the furthest, ray 2 the second furthest, ...). With fewer enemies than rays, the spare rays are off. Each ray retargets on its own the instant its target dies or leaves range. Bolt's own tier does not change the ray's rate.
- **Rapid added ("Attacks 50% faster, hits 25% lighter"):** multiplies the beam's per-second damage by the same net factor it gives a shot tower: 1.5 x 0.75 = x1.125 (Rare 1.65 x 0.75, Epic 1.85 x 0.75), on every ray and every Beam-added line of this tower. Stacks multiplicatively like it does on shots.
- **Rally:** a beam tower inside a Rally ring, or with Rally added, gets its per-second damage x1.10 per rally (the rally's "attacks 10% faster"), on every ray and line.
- **Look:** each extra ray is drawn exactly like the main beam (same color, same width, same tick at the hit end), each from the barrel.
- **Panel:** the tower panel's description says it, e.g. "Beams the 2 furthest enemies: 9 per second each". The panel's damage-per-second line (T0084) counts every ray and the multipliers.

## Acceptance criteria
- [ ] Beam first + 1 Bolt with 2+ enemies in range: two full-rate beams on the two enemies furthest along; with 1 enemy, one beam.
- [ ] Beam first + 2 Bolts: three rays on three different enemies.
- [ ] Beam first + Rapid (Common): every ray deals 1.125x the beam's per-second damage; a unit test pins the value.
- [ ] A beam tower in a Rally ring deals 1.10x per second; a unit test pins it.
- [ ] Kills by any ray pay through the normal kill path (gold, combo, Mint, the kills line), attributed to the tower.
- [ ] The tower panel's text and its damage-per-second line reflect the rays and multipliers.
