---
id: T0282
title: "Spray crits: the shotgun rolls for double damage"
size: M
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T10:37:56Z
claimed_at: 2026-10-30T11:10:31Z
epic: E4
designer: cachyos-x8664
---

## Goal
Today an added Spray does nothing on any tower except a Spray tower: its only added effect is "+N pellets", which only a Spray blast can use. Give the shotgun a crit identity instead. A Spray tower's pellets can crit for double damage, and an added Spray gives crit chance to any tower. That makes Spray a card worth adding anywhere, and crits are a feel the game doesn't have yet: every so often a hit lands twice as hard, and you see it.

## Details
- **Crit rule:** a crit hit deals **double** the damage that hit would otherwise deal, after every other multiplier (Mark, Rally, Momentum and so on). Each hit rolls separately against the tower's crit chance. Crit chance is capped at 100%.
- **Spray as a tower (first augment):** an inherent **20%** crit chance at every tier, on every pellet. Each pellet rolls on its own, so one blast can be a mix of crits and normal hits. Pellets, damage, cooldown and range are unchanged.
- **Spray added (to any tower, Spray towers included):** **+15% / +20% / +25%** crit chance at Common / Rare / Epic, additive per copy. Examples: a Bolt tower with a Common Spray added crits 15% of the time; a Spray tower with a Common Spray added crits 35%.
  - This **replaces** "+2/+3/+4 pellets per blast". An added Spray no longer adds pellets. A Bolt added to a Spray tower still adds a pellet (T0134), so Bolt stays the "more projectiles" card.
  - Remove `added.spray` and `tiers.*.addedSpray`, and the `spec.kind === 'spray'` gate in `towerSpec`, which is no longer needed.
- **Depends on the inbox task "Beam and burn deal damage in ticks".** Land that first: crits need beams and burns to hit in discrete ticks.
- **What can crit:** every individual hit:
  - shots, including Bolt-added extra shots;
  - pellets;
  - pierce hits (each roll is separate);
  - Splash's pulse, rolled per enemy struck, and a Splash-added burst, rolled once for the whole burst;
  - Bolt-added bolts on pulse towers;
  - **beam ticks**, each tick rolling separately, on every ray;
  - **burn ticks**, rolled against the crit chance of the tower that lit the burn.

  Traps are out of scope, and gold is never doubled.
- **A crit strengthens the hit's effects too, not just its damage.** On a crit, the effects that hit carries are doubled:
  - slow duration ×2 (the slow percentage stays the same);
  - root duration ×2;
  - a burn it lights lasts ×2 as long (its per-second rate stays the same);
  - push distance ×2.

  The mark percentage is unchanged, so marks don't stack up through crits. On a beam, push and root ride on every 4th tick, so a crit on that tick doubles them. This is what makes crit worth adding to a support build: a Frost tower with a Spray added sometimes freezes much longer.
- **Randomness:** crit rolls use their own seeded stream from the run's seed, kept separate from the draft's RNG. A given seed then still gives the same drafts whether or not crits happen, and smoke runs stay reproducible.
- **Look and sound:** a crit hit's burst is about 1.5× larger and briefly flashes white over the tower's colour, so a crit is visible at a glance. A beam tick crit flashes the line's target end white. A burn tick crit flickers the flame a bit brighter. If there's a hit sound, a crit plays it a few semitones higher, at the same volume, never louder than the hit blip, and silent with sound off.
- **Card lines** (inside the 70- and 56-character caps):
  - `asTower`: "Blasts 5 pellets in a cone, 20% to crit for double damage."
  - `asAdded`: "+15% crit chance: crits deal double damage." at Common; "+20% …" at Rare; "+25% …" at Epic.
  - `description`: "Blasts 5 pellets in a cone, 20% to crit. Added: +15% crit chance."
  - Update the `tierStrength` test so Spray states its real crit percentage at every tier. It currently checks "+N" pellets.
- **Panel:** the tower panel says "crits N% of hits for double damage" when its crit chance is above 0. The damage-per-second line (T0084) multiplies by (1 + crit chance) as the expected value, so a lone Common Spray's point-blank figure grows by 20%.
- **Balance:** Spray's pellet numbers stay as they are; the 20% built-in crit is its buff. Play a Spray-first opening through waves 1–10 against a Bolt-first one and report how it compares in the result, but don't retune it in this task.

## Acceptance criteria
- [ ] A lone Spray tower crits about 20% of its pellets (each pellet rolled separately) for exactly double damage, and the crit pellets show the larger white-flash burst.
- [ ] An added Spray gives +15% / +20% / +25% crit chance by tier to any tower (shot, pulse, beam), additive per copy, capped at 100%. It adds no pellets.
- [ ] Beam ticks and burn ticks each roll for crit (burn using the lighting tower's chance), and their crits are visible.
- [ ] A crit doubles the slow and root duration, the burn duration and the push distance it carries. Mark percentage and gold never double.
- [ ] The same seed gives the same drafts with or without crits in play.
- [ ] Card lines, panel line and damage-per-second figure as above. Unit tests cover the crit chance in `towerSpec` (first, added, stacked, capped), the expected value in `towerDps`, and that the damage is exactly ×2 on a crit roll.
- [ ] `npm run check` passes. Desktop 1280x720 and mobile 412x915 smoke pass.
