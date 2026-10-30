---
id: T0300
title: Anchor from Rare up, Push only as Epic
size: M
priority: 1
status: todo
depends_on: []
attempts: 0
created: 2026-10-30T19:32:38Z
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

## Design (architect, desktop)

### Files
- edit `src/content/types.ts` — add `minTier?: Tier` to `AugmentDef` right after `tier` (line 224).
- edit `src/core/augments.ts` — import `tierIndex` from `./tiers` (line 11), extend the `rollOffer` candidates filter (line 414), one clause in its doc comment.
- edit `src/content/augments/anchor.ts` — swap `tier: 'epic'` for `minTier: 'rare'`, give the epic tier its new values, update the header comment.
- edit `src/content/augments/push.ts` — add `tier: 'epic'`, remove `opening: true`.
- edit `tests/core/mark.test.ts` — Epic-only list, `minTier` check.
- edit `tests/core/tierStrength.test.ts` — the added-form check only covers rollable rarities.
- edit `tests/core/anchor.test.ts` — the two tests asserting "Epic has the base values" must follow the new numbers or `npm run check` fails.
- edit `tests/core/augments.test.ts` — one new seeded `rollOffer` test in `describe('rollOffer')`, after the Mint test (line 373).

### Interfaces
In `AugmentDef` (`src/content/types.ts`), after the `tier?: Tier;` line:
```ts
  /** This augment never appears as cards of a tier below this one (undefined: any tier). */
  minTier?: Tier;
```
`rollOffer` (`src/core/augments.ts`): line 11 becomes `import { rollTier, tierAdded, tierFirst, tierIndex } from './tiers';`; the candidates filter on line 414 becomes:
```ts
const candidates = open.filter((a) => !taken.has(a.id) && !banned.has(a.id) && (a.tier === undefined || a.tier === tier) && (a.minTier === undefined || tierIndex(tier) >= tierIndex(a.minTier)));
```

### Steps
1. `types.ts`: add the `minTier` field above, exactly after `tier`.
2. `core/augments.ts`: add `tierIndex` to the import; change the filter as above; in the `rollOffer` doc comment, after "so it can never exist as any other tier" add: `, and an augment with a `minTier` (Anchor) is never in the pool for cards below that tier`.
3. `anchor.ts`: replace `tier: 'epic'` and the `tiers` block with:
```ts
  minTier: 'rare',
  // The Rare is the base values themselves (an unset TierValues field keeps the base).
  tiers: {
    rare: { asAdded: 'Hits root for 0.5s (+0.25s per extra Anchor).' },
    epic: { rootSec: 1, cooldownMul: 2.6 / 3, addedRootSec: 0.75, asTower: 'Roots everything within 2.5 cells for 1s, every 2.6s.', asAdded: 'Hits root for 0.75s (+0.25s per extra Anchor).' },
  },
```
  Update the header comment's last sentence to: "It rolls from Rare up (`minTier`): the Rare is the base values, and the Epic roots a little longer, a little more often." Base `first`/`added` and the top-level `asTower`/`asAdded` lines stay.
4. `push.ts`: delete the `opening: true` line, add `tier: 'epic'` where it was. Everything else (base values, both `tiers` entries) stays.
5. `mark.test.ts`: the test at line 37 becomes named `'is Epic-only and may open a run; Push, Rally, Haste, Mint and Toll are Epic-only as well'`, with `const epicOnly = ['mark', 'rally', 'haste', 'mint', 'toll', 'push'];` and one extra line at the end of the test: `expect(getAugment('anchor').minTier).toBe('rare');`
6. `tierStrength.test.ts`: import `tierIndex` from `../../src/core/tiers`, and the first test becomes:
```ts
  it('every augment has a different added form at each rarity it can roll', () => {
    for (const def of AUGMENTS) {
      if (def.tier !== undefined) continue; // the epic-only augments never roll another tier
      const rollable = TIER_ORDER.filter((tier) => def.minTier === undefined || tierIndex(tier) >= tierIndex(def.minTier));
      const forms = rollable.map((tier) => JSON.stringify(tierAdded(def, tier)));
      expect(new Set(forms).size).toBe(rollable.length);
    }
  });
```
7. `anchor.test.ts`: the test at line 27 becomes:
```ts
  it('rolls from Rare up; the Rare is the base, the Epic roots 1s every 2.6s', () => {
    expect(anchor.minTier).toBe('rare');
    expect(anchor.tier).toBeUndefined();
    expect(towerSpec([copy('anchor', 'rare')]).root?.sec).toBeCloseTo(0.75);
    expect(towerSpec([copy('anchor', 'rare')]).rate).toBeCloseTo(1 / 3);
    expect(towerSpec([copy('anchor', 'epic')]).root?.sec).toBeCloseTo(1);
    expect(towerSpec([copy('anchor', 'epic')]).rate).toBeCloseTo(1 / 2.6);
    expect(towerSpec([copy('anchor', 'epic'), copy('anchor', 'epic')]).root?.sec).toBeCloseTo(1.25);
    expect(towerSpec([copy('bolt'), copy('anchor', 'epic')]).root?.sec).toBeCloseTo(0.75);
    let seen = 0;
    for (let seed = 1; seed <= 300; seed++) {
      for (const c of rollOffer(new Rng(seed), AUGMENTS, 3, 30)) {
        if (c.id !== 'anchor') continue;
        expect(c.tier).not.toBe('common');
        seen += 1;
      }
    }
    expect(seen).toBeGreaterThan(0);
  });
```
  and the test at line 49 becomes:
```ts
  it("the card's lines state each tier's numbers", () => {
    expect(tierTowerLine(anchor, 'rare')).toBe('Roots everything within 2.5 cells for 0.75s, every 3s.');
    expect(tierAddedLine(anchor, 'rare')).toBe('Hits root for 0.5s (+0.25s per extra Anchor).');
    expect(tierTowerLine(anchor, 'epic')).toBe('Roots everything within 2.5 cells for 1s, every 2.6s.');
    expect(tierAddedLine(anchor, 'epic')).toBe('Hits root for 0.75s (+0.25s per extra Anchor).');
  });
```
8. `augments.test.ts`, inside `describe('rollOffer')` after the Mint test:
```ts
  it('Anchor never rolls as Common, and Push only as Epic (never in the opening draft)', () => {
    let anchors = 0;
    let pushes = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new Rng(seed);
      for (const wave of [1, 5, 10, 20, 30]) {
        for (const c of rollOffer(rng, AUGMENTS, 3, wave, false)) {
          if (c.id === 'anchor') { anchors += 1; expect(c.tier).not.toBe('common'); }
          if (c.id === 'push') { pushes += 1; expect(c.tier).toBe('epic'); }
        }
      }
      expect(rollOffer(new Rng(seed), AUGMENTS, 3, 1, true).some((c) => c.id === 'push')).toBe(false);
    }
    expect(anchors).toBeGreaterThan(0);
    expect(pushes).toBeGreaterThan(0);
  });
```
  All imports it needs (`Rng`, `AUGMENTS`, `rollOffer`) are already in the file.

### Pitfalls
- Epic's `rootSec: 1` also leaks into the added form (`tierAdded` uses `addedRootSec ?? rootSec ?? base`), so `addedRootSec: 0.75` must be set alongside it — both are in the snippet; keep both.
- `asAdded` is required in every `TierValues` entry: the rare entry keeps today's line verbatim; `asTower` there is left unset on purpose (it falls back to the base line, so the Rare card reads exactly as today's card does).
- Removing `opening` from Push is what keeps it out of the opening draft: `push.first.damage` is 0, so `rollOffer`'s opening filter drops it. The existing opening tests (mark.test.ts:46, augments.test.ts:354) already enforce this.
- No UI/scene changes: the codex's "· Epic" chip is driven by `def.tier` (Push gets it, Anchor loses it), and cards render whatever `tierTowerLine`/`tierAddedLine` return; both new lines are under 56 chars, which `tests/content.test.ts` enforces.
- Don't touch `agents/` (the module guide is the owner's), and don't reorder `AUGMENTS` in `content/augments/index.ts` — no augment is added or removed.

### Tests
- All edits in steps 5–8 are the unit tests: mark.test.ts (Epic-only list + `minTier: 'rare'`), tierStrength.test.ts (rollable-rarity added forms), anchor.test.ts (Rare = base, Epic = 1 s / 2.6 s / 0.75 s, card lines), augments.test.ts (seeded drafts: Anchor never Common, Push only Epic, never opening).
