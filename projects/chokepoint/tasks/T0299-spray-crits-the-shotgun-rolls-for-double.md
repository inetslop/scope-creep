---
id: T0299
title: "Spray crits: the shotgun rolls for double damage (the T0282 re-file)"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-30T18:18:58Z
epic: E4
design_attempts: 1
---

## Goal
The up-close tower gets a spicy moment: every pellet of a Spray blast can roll for double damage, seen where it lands.

## Details
- Every pellet of every Spray blast (first form and added pellets alike) rolls independently: 15% chance to crit, that pellet dealing double its normal damage (8 instead of 4 on Common; the tier's damageMul applies as usual, then the doubling). A crit only doubles that pellet's damage — range, other effects and the rest of the blast are unchanged.
- A critting pellet's impact: the normal hit flash plus one small yellow chip (~8 px, the combo-milestone yellow, T0034) at the impact point. A kill by a critting pellet is an ordinary kill: same gold, Mint bonuses, combo and source-tower kills line as a non-crit kill. No new sound.
- The tower panel's "≈ N/s" line (T0084) counts expected pellet damage for Spray: pellets × damage × 1.15, so the line stays honest. No other augment's term changes.
- Card lines: asTower becomes "Blasts 5 pellets in a cone: 15% hit for double." (47 characters, under the 56-character tier-line cap that killed T0093). asAdded is unchanged at every tier ("+2 pellets per blast." / "+3 …" / "+4 …" — the chance is the same at every tier; the tiers scale the pellet damage the crit doubles). The codex description follows: "Blasts 5 pellets in a cone: deadly up close, 15% hit for double. Added: +2 pellets per blast."
- The tower's look, the what-if preview (T0096) and the beam-kill split needles (T0242) are unchanged; the split needles keep their flat 12 damage and never crit.

## Card lines
- asTower: "Blasts 5 pellets in a cone: 15% hit for double." (all tiers)
- asAdded: "+2 pellets per blast." / Rare "+3 pellets per blast." / Epic "+4 pellets per blast." (unchanged)

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Rapid | changes Spray's damage when added (damageMul) | a flat, always-on multiplier on every pellet — the crit is a per-pellet roll that misses most pellets and spikes a few, with a visible moment where it lands |
| Mark | changes damage taken (+25% from all) | a flat, target-side change on marked enemies — the crit is an attacker-side roll that works on any target and shows itself at the impact |
| Beam-kill split needles (T0242) | the same pellet look on a kill | a flat 12-damage follow-up that never varies — the crit changes the blast itself, pellet by pellet |

No existing augment rolls per-hit damage variance; the crit joins no `first.kind` or `added` row and adds no field to the added-form index.

## Acceptance criteria
- [ ] A unit test with the roll forced: a critting pellet deals exactly twice the normal pellet damage (the tier's damageMul applied before the doubling), and non-crit pellets are byte-identical to today's damage.
- [ ] A critting pellet's impact shows one small yellow chip (the milestone yellow) at the impact point on top of the normal hit flash; non-crit pellets show no chip.
- [ ] A kill by a critting pellet pays normal kill gold, Mint bonuses and combo, and counts for the source tower's kills line, exactly like a non-crit kill.
- [ ] The "≈ N/s" line on a Spray tower is 15% higher than before the change (pellets × damage × 1.15) and no other augment's term moves.
- [ ] Draft, hand, tower panel and codex show the new asTower line "Blasts 5 pellets in a cone: 15% hit for double." and the unchanged added lines.
- [ ] Beam-kill split needles (T0242) still deal a flat 12 each and never crit.
