---
id: T0242
title: "Beam combos IIb: a beam kill splits into Spray needles"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-30T00:29:56Z
epic: E4
design_attempts: 1
---

## Goal
Finish the beam's combination set (T0130, T0210, T0132): when a beam kills, the corpse splits into Spray's needles — the one beam clause that turns a kill into a new attack on other enemies, so a Beam + Spray tower pays for the Spray's slot with every kill.

## Details
- When a Beam-first tower deals the killing blow (its own beam line, its added beams or the T0210 Lance corridor — anything the source-of-kill rule attributes to it) and the tower has one or more Sprays added, one homing needle launches from the corpse per Spray copy added.
- The needles seek different nearest other living enemies within 2 cells of the corpse (one target per needle, as Spray's split did); a needle with no enemy in reach does not launch — nothing ever fires at nothing.
- Each needle: 12 damage, homing like a Bolt, at the Spray pellet's speed, in the Spray pellet's look tinted with the killing tower's color (the lighter tint), so a needle reads as "the beam tower's Spray."
- A needle's damage counts for the killing beam tower: its panel kills line, the end card's by-tower chips, the combo and Mint's aura all attribute it to the beam tower. A needle kill is itself a beam kill — it launches the split again (the cascade is bounded by the 2-cell reach and the 12 damage per needle).
- The split is a kill moment only: the beam's ongoing ticks never split, a beam tower without added Spray is unchanged, a Spray-first tower (the shotgun) is unchanged, and the "≈ N/s" line gains no term from added Spray on a beam (a kill bonus, not cadence). No new sound.
- No new mark on the tower: it already shows its Sprays in its slots; the needles are the effect's own feedback.
- Card lines: unchanged — Spray keeps "Blasts 5 pellets in a cone: deadly up close. Added: +2 pellets per blast." (the clause is a board interaction, not a card change, as Bolt's card is unchanged by its beam ray, T0130).
- New files: the split as a new enemy hook on the burnLeap pattern (T0059) plus a small pure module for the split's math (how many needles, which targets), unit-tested; the hook's registry line is the only edit to a shared file besides the projectile spawn.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Spray | the added form this changes: +2 pellets per blast, inert on a beam (no shots) | makes the added form work on a beam: a kill launches homing needles at enemies the beam is not holding |
| Beam | the host's kind (beam) | gives the beam's kill a projectile consequence — a beam never produced a projectile before |
| Bolt (T0130) | a beam combo: an added form changing the beam's lines | adds parallel rays that fire on the beam's own cadence at the beam's targets; this fires once per kill, at other enemies, and can chain from its own kills |
| Lance (T0210) | a beam combo | extends the beam's line straight through the target it is holding; this redirects damage from a dead target to live ones |
| Splash (T0210) | a beam combo | scorch adds damage to the beam's current target; this attacks different enemies |
| Mint | a kill-triggered effect | the kill drops gold for an aura within 2 cells; this kill deals damage, and only the killing tower's own Sprays count |

## Acceptance criteria
- [ ] A Beam-first tower with one added Spray: when the beam deals the killing blow, one small homing needle (12 damage, the pellet's look and speed in the tower's lighter tint) flies to the nearest other living enemy within 2 cells of the corpse; with none in reach, nothing launches.
- [ ] Two added Sprays launch two needles at two different nearest enemies; the kill and any needle kills count for the beam tower on its panel kills line and the end card's by-tower chips, and a needle kill launches the split again.
- [ ] A beam tower without added Spray, a Spray-first tower, every non-beam kill and the beam's ongoing ticks are unchanged; the "≈ N/s" line is unchanged by added Spray on a beam.
