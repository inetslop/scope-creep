---
id: T0300
title: Anchor from Rare up, Push only as Epic
size: M
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T19:32:38Z
claimed_at: 2026-10-30T19:42:24Z
designer: desktop
---

## Goal
Anchor is Epic-only and Push comes at every rarity, but Push is the stronger of the two. Swap their rarity: Anchor can roll as Rare or Epic (about five times as often as today), and Push only as Epic. Anchor's Rare is today's Anchor, and its Epic is a step stronger.

## Details
- **A minimum rarity for an augment:** `AugmentDef` (`src/content/types.ts`) gains `minTier?: Tier`: "this augment only appears as cards of this tier or better". `tier` stays as it is ("only this tier"). In `rollOffer` (`src/core/augments.ts`) a card of rolled tier `t` can be an augment when `a.tier` is unset or equal to `t` (as now), and `a.minTier` is unset or `tierIndex(t) >= tierIndex(a.minTier)` (`src/core/tiers.ts`).
- **Anchor** (`src/content/augments/anchor.ts`): remove `tier: 'epic'` and set `minTier: 'rare'`. Its base values stay; they are now its Rare (a Rare copy uses `tiers.rare`, which changes nothing). Its Epic gets stronger:

| Anchor | Rare (today's values) | Epic |
| --- | --- | --- |
| as a tower | roots everything within 2.5 cells for 0.75 s, every 3 s | for 1 s, every 2.6 s (`rootSec: 1`, `cooldownMul: 2.6 / 3`) |
| added | hits root for 0.5 s (+0.25 s per extra Anchor) | 0.75 s (`addedRootSec: 0.75`), +0.25 s per extra as now |

  Card lines at each tier state these numbers (`asTower` and `asAdded` in both `tiers` entries). Update Anchor's header comment: it rolls from Rare up.
- **Push** (`src/content/augments/push.ts`): set `tier: 'epic'` and remove `opening: true` (an Epic-only card is too rare to count on in the opening draft). It keeps its Epic values: pushes everything back 1.2 cells every 1.8 s; added, hits push back 0.8 cells.
- **Tests:**
  - `tests/core/mark.test.ts` lists the Epic-only augments: Anchor leaves the list, Push joins it. Add a check that Anchor has `minTier: 'rare'`.
  - `tests/core/tierStrength.test.ts`: the "different added form at each rarity" check covers only the rarities an augment can roll. For Anchor that's Rare and Epic, not Common.
  - A new test: over many seeded `rollOffer` calls, no Anchor card is ever Common, and no Push card is ever below Epic.
- **The augments module guide** is the owner's: leave `agents/` alone.

## Acceptance criteria
- [ ] Anchor cards come as Rare or Epic, never Common; Push cards only as Epic, and never in the opening draft.
- [ ] A Rare Anchor plays exactly as Anchor does today; an Epic Anchor roots for 1 s every 2.6 s, and added roots for 0.75 s. The card lines say so.
- [ ] Push's Epic numbers are unchanged.
- [ ] `npm run check` and the smoke test pass.
