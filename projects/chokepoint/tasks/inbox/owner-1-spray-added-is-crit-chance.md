---
title: An added Spray is crit chance, on every damage tower
size: L
priority: 1
---

## Goal
The owner's call: Spray's added form stops adding pellets. Put into any later slot of any tower that deals damage, a Spray now gives that tower **crit chance**, so Spray is the crit augment everywhere, not only on a Spray tower. A Spray tower keeps its own blast of 5 pellets and its own 15% crit (T0299).

## Details
- **The added form:** "+N% crit chance" per copy, tiered Common < Rare < Epic. The architect picks the three numbers (each tier line within the 56-char cap). Copies add up: two Common copies give 2N%. The tower's total is capped at 100%.
- **A crit is what it is today on a Spray pellet:** that hit deals double damage, and the yellow crit chip (`systems/fx/critChip.ts`) shows at the impact.
- **The tower's crit chance** = its first form's own chance (15% for a Spray-first tower, 0 for every other first) + every added Spray's percent.
- **What rolls, per attack kind** (one roll per damage instance, with the run's seeded rng):
  - shot (Bolt, Rapid, Lance, ...): each enemy a shot damages, the first hit and every pierce or burst hit.
  - spray: each pellet (as today), now at the tower's total chance.
  - pulse (Splash first): each enemy a pulse hits, and each bolt the pulse fires.
  - beam: each damage tick of the main line and of its rays (the T0281 ticks).
  - burn (Ember first, or an Ember added): each burn tick, at the crit chance of the tower that set the enemy ablaze.
  - mark, rally and the 0-damage supports (Frost first, Haste, Mint, Toll): nothing, there is no damage to crit. Acceptable: the card line says it works on damage.
- **Gone:** an added Spray adds no pellets anywhere (Spray tower or not), and a beam kill no longer splits into needles per added Spray (T0242: `core/sprayNeedles.ts`, `systems/enemyHooks/sprayNeedles.ts` and their tests and registry line are removed). A Bolt added to a Spray tower still adds one pellet (unchanged).
- **Card lines:** Spray's `description` and its `asAdded` per tier name the crit, e.g. "+N% crit chance on any damage." `asTower` is unchanged.
- **Shown:** the tower panel's line (`describeSpec`) ends with ", N% crit" when the tower's chance is above 0 (a Spray tower shows its 15%); the "≈ N/s" line (`core/towerDps.ts`) counts crits at their expected value (× (1 + chance)); the codex and the what-if preview carry the change from the def. The tower keeps its existing Spray ticks, one per copy.

## Acceptance criteria
- [ ] A Bolt tower with one added Common Spray has crit chance N% (unit test on the spec); a crit hit deals double and shows the yellow chip.
- [ ] A Spray tower with an added Spray fires 5 pellets (not 7) at 15% + N% crit.
- [ ] Beam ticks, Splash pulses and Ember burn ticks crit when their tower has crit chance; a Mark, Rally or Frost-first tower with an added Spray behaves exactly as without it.
- [ ] No needles on a beam kill; the needle code and its tests are gone.
- [ ] The tier lines fit the 56-char cap; the panel shows the crit; "≈ N/s" includes it.
