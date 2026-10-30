---
title: "Rarity matters when added: Bolt, Spray and Push grow at Rare and Epic"
size: M
priority: 2
---

## Goal
A Rare or Epic card should always be worth more than a Common one, as a tower's first augment and when added to a tower. Most augments already do this: Lance adds +1, +2 or +3 pierce; Frost slows by 40, 50 or 60%. Three don't: an added Bolt, Spray or Push is the same at every rarity, so their gems promise nothing. Make their added forms grow with rarity, make every card line show its real numbers, and add a test so a future augment can't miss this.

## Details
- **The new added forms** (each copy adds its own amount, stacking as now):

| Augment | Common | Rare | Epic |
| --- | --- | --- | --- |
| Bolt | +1 shot | +2 shots | +3 shots |
| Spray | +2 pellets | +3 pellets | +4 pellets |
| Push | hits push back 0.4 cells | 0.6 cells | 0.8 cells |

- **The tiers' fields:** `tierAdded` in `src/core/tiers.ts` has no tier override for `extraShots`, `spray` or the added `push` (the tier's `push` only changes the first form). Add added-only tier fields the way `addedRateMul` and `addedRangeMul` work (e.g. `addedShots`, `addedSpray`, `addedPush` in `src/content/types.ts`), and set them in `src/content/augments/bolt.ts`, `spray.ts` and `push.ts`.
- **The card lines show the real number at each tier** (`asAdded`):
  - Bolt: "One more shot each attack." / "Two more shots each attack." / "Three more shots each attack."
  - Spray: "+2 pellets per blast." / "+3 pellets per blast." / "+4 pellets per blast."
  - Push: "Hits push back 0.4 cells, more with each Push." / "… 0.6 cells, …" / "… 0.8 cells, …"
  - Lance (wrong today: Rare and Epic say "+1 pierce."): "+1 pierce." / "+2 pierce." / "+3 pierce."
- **Barrels:** a tower draws one barrel per shot, so three Epic Bolts would draw ten. Draw at most 5 barrels; more shots share them (`muzzle(i)` already wraps).
- **A test that guards every augment** (`tests/core/`): for each augment that can roll more than one rarity, its added form at Rare is stronger than at Common, and at Epic stronger than at Rare. It also checks the numbers in each tier's `asAdded` line match its added form, for the augments above and Lance.
- **Keep:** the first forms and their card lines, the draft's odds, and the Epic-only augments (Anchor, Mint, Toll, Rally, Mark), which only ever come as Epic.

## Acceptance criteria
- [ ] Added to a tower, a Rare Bolt gives 2 extra shots and an Epic 3; Spray gives 3 and 4 pellets; Push pushes 0.6 and 0.8 cells. Common is unchanged.
- [ ] Every card's added line at every rarity states the number it really gives, Lance included.
- [ ] A tower with many shots draws at most 5 barrels.
- [ ] The new test fails if any augment's added form is the same at two rarities.
