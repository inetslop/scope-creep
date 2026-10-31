---
id: T0322
title: An added Beam is more damage, on every damage tower
size: M
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-10-31T23:37:22Z
---

## Goal
The owner's call: Beam's added form becomes a plain **damage boost** that works on every tower that deals damage, not only on a beam tower. Today (T0316) an added Beam adds a flat 5/7/9 per second to a beam tower's line and does nothing on any other tower.

## Details
- **The added form:** "+N% damage" per copy, tiered Common < Rare < Epic. The architect picks the three numbers (each tier line within the 56-char cap). Copies add up into one sum per tower (two Common copies: +2N%), then multiply the tower's damage once.
- **What it boosts, per attack kind:** every damage the tower deals: shot hits (and their pierce and burst hits), spray pellets, pulse hits and the bolts a pulse fires, the beam's ticks (main line and rays), and the burns the tower sets (their per-second rate).
- **mark, rally and the 0-damage supports** (Frost first, Haste, Mint, Toll): nothing, there is no damage to boost. Acceptable: the card line says it is damage.
- **Gone:** the flat per-second addition to a beam tower's line. A beam tower keeps its look of one width step thicker per added Beam (it is now the boost's read on a beam); any other damage tower shows its added Beams the way the other added augments show in `entities/towerLook.ts` (one tick per copy).
- **Card lines:** Beam's `description` and its `asAdded` per tier, e.g. "+N% damage." `asTower` is unchanged.
- **Shown:** the tower panel's line (`describeSpec`) shows the boosted numbers; the "≈ N/s" line (`core/towerDps.ts`), the codex and the what-if preview carry it from the def.

## Acceptance criteria
- [ ] Unit tests: a Bolt tower with one added Common Beam deals N% more per hit; two copies deal 2N% more; a Common Beam tower with one added Common Beam beams N% more per second; an Ember tower's burn rate grows by N%.
- [ ] A Mark, Rally or Frost-first tower with an added Beam behaves exactly as without it.
- [ ] No flat beam addition is left; the beam tower still thickens per added Beam.
- [ ] The tier lines fit the 56-char cap; the panel and "≈ N/s" show the boost.
