---
id: T0280
title: Beam added is a damage boost, not another beam
size: M
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T10:37:56Z
claimed_at: 2026-10-30T11:05:00Z
epic: E4
designer: desktop
---

## Goal
Adding more targets is Bolt's job: on a Beam tower each Bolt already adds a ray (T0130). Today an added Beam also adds a second line on the nearest enemy, which blurs the two roles. Make an added Beam a plain damage boost instead, so Bolt means more beams and Beam means stronger beams, on any tower.

## Details
- **New added form:** +25% / +35% / +50% damage at Common / Rare / Epic, multiplicative per copy like the other multipliers (two Common Beams added give ×1.5625).
- **What it multiplies:** the tower's own damage on every attack kind:
  - shot damage on Bolt, Lance, Rapid and Reach towers;
  - pellet damage on Spray;
  - pulse damage on Splash;
  - Bolt-added bolts on pulse towers (`boltDamage`);
  - the beam's per-second rate on a Beam tower, on every ray (Bolt rays included).

  It also boosts burn: once the inbox task "Beam and burn deal damage in ticks" lands, burn ticks scale with the tower's damage multipliers, and this boost is one of them. On towers whose only effect is a non-damage one (Frost, Anchor, Push, Mint, Rally, Mark, Toll) it does nothing, the same honesty rule as before.
- **Remove the second line completely:** `added.beam`, `addedBeamDps`, `spec.beamExtras`, the nearest-enemy extra line in `BeamSystem`/`core/beam.ts`, its drawing and sound, and its term in `core/towerDps.ts`. Rays from Bolt are unaffected.
- **Card lines:**
  - `asAdded`: "+25% damage." at Common, "+35% damage." at Rare, "+50% damage." at Epic.
  - `description`: "A continuous beam on the furthest enemy. Added: +25% damage."
  - `asTower` is unchanged.
- **Look:** keep T0133's one tick per added Beam around the orb, and the existing tick on other towers' barrels. They now mean "boosted" instead of "extra line".
- **Panel:** the tower panel's description and its damage-per-second line (T0084) include the boost. For example, a Common Beam with a Common Beam added reads 6 × 1.25 = 7.5 per second, or 17.5 if the balance task has landed first.
- **Order with the balance task:** the inbox task "Balance: Beam hits too softly" also edits `beam.ts`. Whichever lands second rebases onto the other. This task changes only `added` and the tiers' added fields.
- **Tests:** replace the extra-line tests in `tests/core/beam*.test.ts` and `towerDps.test.ts` with boost tests. `tierStrength`'s "a different added form at each rarity" still holds (25/35/50).

## Acceptance criteria
- [ ] Adding a Beam to any tower never draws a second beam line. A Beam tower with Beams added still has exactly one line, plus one per Bolt.
- [ ] An added Beam multiplies the tower's damage by 1.25 / 1.35 / 1.5 by tier, on shots, pellets, pulses and beam rays, and stacks multiplicatively. It changes nothing on a no-damage tower, and boosts burn ticks through the tick task's damage scaling.
- [ ] Draft cards read "+25% damage." / "+35% damage." / "+50% damage." by tier, inside the 56-character tier cap.
- [ ] The panel's damage-per-second figure includes the boost. No `beamExtras` or extra-line code remains.
- [ ] `npm run check` passes. Desktop 1280x720 and mobile 412x915 smoke pass.
