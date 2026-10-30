---
id: T0246
title: "Rarity matters when added: Bolt, Spray and Push grow at Rare and Epic"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-30T00:51:08Z
design_attempts: 1
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

## Design (architect, cachyos-x8664)

### Files
- edit `src/content/types.ts` — add three optional fields to `TierValues` (after `addedRangeMul`, line 79): `addedShots?: number`, `addedSpray?: number`, `addedPush?: number`
- edit `src/core/tiers.ts` — `tierAdded()` applies the three new overrides; doc line on it
- edit `src/content/augments/bolt.ts` — tiers get `addedShots` + the two rare/epic `asAdded` lines
- edit `src/content/augments/spray.ts` — tiers get `addedSpray` + the two `asAdded` lines
- edit `src/content/augments/push.ts` — tiers get `addedPush`; all three `asAdded` lines (common reworded)
- edit `src/content/augments/lance.ts` — rare/epic `asAdded` lines fixed (its pierce already tiers via `tiers.pierce`)
- edit `src/core/augments.ts` — in `towerSpec()`, the "Pushes in any slot" loop (line 216) must take the per-hit push from `tierAdded(a, copy.tier)` instead of the raw `a.added.push`
- edit `src/entities/towerLook.ts` — `MAX_BARRELS` 4 → 5
- create `tests/core/tierStrength.test.ts` — the guard test
### Interfaces
No signatures change; new fields on the existing `TierValues` in `src/content/types.ts`:
```ts
/** Replaces this copy's added extra shots per attack (Bolt). */
addedShots?: number;
/** Replaces this copy's added pellets per blast (Spray). */
addedSpray?: number;
/** Replaces this copy's added per-hit push-back cells (Push). */
addedPush?: number;
```
In `tierAdded()` (`src/core/tiers.ts:61`) add three lines after `pierce: t.pierce ?? a.pierce,`:
```ts
extraShots: t.addedShots ?? a.extraShots,
spray: t.addedSpray ?? a.spray,
push: t.addedPush ?? a.push,
```
(`...a` already copies the common values; `tierAddedLine`/`tierFirst`/`towerSpec` need nothing else.)
### Steps
1. `types.ts`: add the three fields one per line with the comments above.
2. `bolt.ts`: rare `{ addedShots: 2, asAdded: 'Two more shots each attack.' }`, epic `{ addedShots: 3, asAdded: 'Three more shots each attack.' }` (keep damageMul/cooldownMul).
3. `spray.ts`: rare `{ addedSpray: 3, asAdded: '+3 pellets per blast.' }`, epic `{ addedSpray: 4, asAdded: '+4 pellets per blast.' }`.
4. `push.ts`: common `asAdded: 'Hits push back 0.4 cells, more with each Push.'`; rare `{ addedPush: 0.6, asAdded: 'Hits push back 0.6 cells, more with each Push.' }`; epic `{ addedPush: 0.8, asAdded: 'Hits push back 0.8 cells, more with each Push.' }` (keep each tier's `push` — first form's gust).
5. `lance.ts`: rare `asAdded: '+2 pierce.'`, epic `asAdded: '+3 pierce.'` (no field change: `tiers.pierce` already sets the added pierce).
6. `src/core/augments.ts` line 216: `if (i > 0) spec.pushPerHit += tierAdded(a, augments[i]!.tier).push ?? 0;` (only other raw `added.push` reader in src).
7. `towerLook.ts` line 19: `export const MAX_BARRELS = 5;` (barrelCount's cap; `Tower.muzzle(i)` already wraps shots past the last barrel).
8. Create `tests/core/tierStrength.test.ts`: (a) for every `AUGMENTS` entry without a `tier` field, `expect(JSON.stringify(tierAdded(def,'rare'))).not.toEqual(JSON.stringify(tierAdded(def,'common')))` and same rare-vs-epic; (b) for bolt/spray/push/lance, at each `TIER_ORDER` tier, `tierAddedLine(def,tier)` contains the number of `tierAdded(def,tier)`'s field (bolt: word from `{1:'One',2:'Two',3:'Three'}` for `extraShots`; spray: `+${spray}`; push: `push.toFixed(1)`; lance: toBe(`+${pierce} pierce.`)); (c) `towerSpec([{id:'bolt',tier:'common'},{id:'bolt',tier}]).shots` is 3 rare / 4 epic; `...spray` is 8/9; `...pushPerHit` toBeCloseTo 0.6/0.8.
9. `npm run check`.
### Pitfalls
- The pushPerHit fix in towerSpec is mandatory: without it a Rare Push still pushes 0.4 and the acceptance numbers fail (Bolt/Spray already flow through `tierAdded` in towerSpec).
- Do not touch first forms, `asTower` lines, `TIER_ODDS`, or the five `tier: 'epic'` augments; the generic test skips exactly those (`def.tier !== undefined`).
- Lance's tier `pierce` replaces both forms' pierce (tierFirst + tierAdded) — pre-existing; only the card line is wrong.
- New `asAdded` lines fit tests/content.test.ts's 6–56 length check (longest is 46).
- MAX_BARRELS stays exported (other tasks may import it); only the number changes.
### Tests
- The new `tests/core/tierStrength.test.ts` itself: fails if any multi-tier augment's added form is identical at two rarities, if any of bolt/spray/push/lance's card line misnames its number, or if a tower doesn't take a second copy at its rolled tier.
