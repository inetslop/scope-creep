---
id: T0002
title: "Rarity in the draft: tiers, odds, and card frames"
assignee: asus
size: L
priority: 1
status: done
depends_on: [T0001]
attempts: 1
created: 2026-10-28T01:07:07Z
claimed_at: 2026-10-28T01:43:05Z
finished_at: 2026-10-28T03:48:31Z
epic: E4
---

## Goal
Sometimes a draft card is something special: every augment now comes in a tier — Common, Rare or Epic — and the draft shows which. This task is the tier data and the draft presentation only; the hand and tower panel (T0008) and the tower pips (T010) build on it.

## Details
- Tiers: Common (the numbers the augment has today), Rare, Epic. Each augment's tier values are stored with the augment so later tasks (and future augments) read them from one place.
- Exact tier values (Rare then Epic, applied to the card text the player reads):
  - Bolt: Rare — damage x1.3, cooldown x0.85. Epic — damage x1.7, cooldown x0.70. The added "+1 shot" is unchanged in all tiers.
  - Rapid: Rare — damage x1.3, cooldown x0.85, added line becomes "attacks 65% faster, hits 25% lighter". Epic — damage x1.7, cooldown x0.70, added line "attacks 85% faster, hits 25% lighter".
  - Reach: Rare — damage x1.3, cooldown x0.85, range x1.15, added line "45% more range". Epic — damage x1.7, cooldown x0.70, range x1.35, added line "55% more range".
  - Splash: Rare — damage x1.3, cooldown x0.85, added line "hits burst over 1.5 cells". Epic — damage x1.7, cooldown x0.70, added line "hits burst over 2 cells".
  - Frost: Rare — slow 50% (was 40%), cooldown x0.85. Epic — slow 60%, cooldown x0.70.
- The draft rolls each of its three cards independently: 70% Common, 25% Rare, 5% Epic.
- The draft card header shows the current odds in small gray text: "Common 70 · Rare 25 · Epic 5".
- Card look: Common keeps the current plain white frame. Rare gets a blue frame (2px) around the card. Epic gets a purple frame (2px). Under the card title, a gem row of small rounded diamonds: 1 light gray gem (Common), 2 blue gems (Rare), 3 purple gems (Epic).
- Card text shows the tier's numbers, so a Rare Rapid card literally reads 65% faster. The card name is unchanged.
- The tier only affects that copy of the augment: a tower built from a Rare Rapid is a Rare Rapid for the rest of the run.

## Acceptance criteria
- [ ] Repeated drafts eventually produce Rare and Epic cards; the odds line always reads "Common 70 · Rare 25 · Epic 5".
- [ ] A Rare Rapid card reads "attacks 65% faster" and its damage number is 30% above the Common card's.
- [ ] Rare cards show a blue frame and 2 blue gems; Epic a purple frame and 3 purple gems; Common is visually unchanged.
- [ ] A tower built from a Rare Rapid behaves with the Rare numbers (verify: attack faster than a Common Rapid tower).
- [ ] The odds line and gem row fit the draft cards at 412x915 and 1280x720 without overlapping the card text.

## Design (architect, desktop)

### Files
- create `src/core/tiers.ts` - tier order, odds, `rollTier`, effective per-tier `first`/`added` forms, the card's added line
- edit `src/content/types.ts` - add `Tier`, `TierValues`, `AugmentCopy`; add `tiers: { rare: TierValues; epic: TierValues }` to `AugmentDef`
- edit `src/content/augments/bolt.ts`, `rapid.ts`, `reach.ts`, `splash.ts`, `frost.ts` - add the `tiers` data below (Common is the existing `first`/`added`; `asTower` never changes)
- edit `src/core/augments.ts` - `towerSpec`/`towerColor` take `AugmentCopy[]` and apply the tier via `tierFirst`/`tierAdded`; `rollOffer` returns `AugmentCopy[]` (each card rolls its own tier); keep `boltDamage: bolt.first.damage` (a tiered Bolt added copy changes nothing, per the spec)
- edit `src/core/run.ts`, `src/config.ts` - `hand: AugmentCopy[]`; `takeAugment(copy: AugmentCopy)`; `useAugment(index): AugmentCopy | undefined`; `START.hand: [] as readonly AugmentCopy[]`
- edit `src/systems/RunFlow.ts` - `offer: AugmentCopy[]`; `openDraft` drops the `.map((a) => a.id)`; `finishDraft(pick: AugmentCopy | undefined)` matches on id AND tier, calls `takeAugment(pick)`
- edit `src/systems/Building.ts` - `heldAugment` → `get heldCopy(): AugmentCopy | undefined` (used only in this file); `tap`/`hover`/`placeHeld` pass the copy through; `hover` builds `[...(tower?.augments ?? []), heldCopy]` straight into `towerSpec`
- edit `src/systems/TowerSystem.ts` - `build(cell, copy: AugmentCopy)`, `place(tower, copy: AugmentCopy)`; `towerColor(tower.augments)` (no `.map(getAugment)`)
- edit `src/entities/Tower.ts` - `augments: AugmentCopy[]`; `addAugment(copy)`; `refresh()` calls `towerSpec(this.augments)` / `towerColor(this.augments)`; `drawPips` reads `copy.id`
- edit `src/ui/hud/HandBar.ts`, `src/ui/hud/TowerPanel.ts` - type-conform only: `getAugment(c.id)`, `augmentTexture(c.id)`. No rarity visuals here (T0008's job)
- edit `src/art/textures.ts` - one line `export const GEM_TEXTURE = 'ui:gem';` after `LIFE_TEXTURE`
- edit `src/art/icons.ts` - in `paintIconTextures`: `paintTexture(scene, GEM_TEXTURE, 10, 10, (ctx) => { shapePath(ctx, 'diamond', 5, 5, 4.6); ctx.fillStyle = rgba(PALETTE.card, 1); ctx.fill(); });`
- edit `src/scenes/DraftScene.ts` - tier presentation (below)
- edit `src/debug/runChecks.ts` - one invariant line after `hand.selection`: `['augments.valid', (g) => { for (const c of [...g.run.hand, ...g.towers.towers.flatMap((t) => t.augments)]) if (!AUGMENTS.some((a) => a.id === c.id) || !TIER_ORDER.includes(c.tier)) return `unknown augment copy ${c.id}:${c.tier}`; return null; }]`
- edit `tests/content.test.ts`, `tests/core/augments.test.ts`, `tests/core/run.test.ts` - see Tests

### Interfaces
```ts
// content/types.ts
export type Tier = 'common' | 'rare' | 'epic';
export interface TierValues {  // unset fields keep the Common value
  damageMul?: number; cooldownMul?: number; rangeMul?: number; // scale the FIRST form's damage, cooldown, range
  slowPct?: number;  // replaces this copy's slow % in both forms (Frost)
  splash?: number;   // replaces this copy's added splash cells (Splash)
  addedRateMul?: number; addedRangeMul?: number; // replace the ADDED form's multipliers (Rapid, Reach)
  asAdded: string;   // the card's added line at this tier
}
export interface AugmentCopy { id: string; tier: Tier; } // a draft card and a hand card

// core/tiers.ts
export const TIER_ORDER: readonly Tier[] = ['common', 'rare', 'epic'];
export const TIER_ODDS: Record<Tier, number> = { common: 70, rare: 25, epic: 5 };
export function rollTier(rng: Rng): Tier;              // next()*100 vs the odds
export function tierIndex(tier: Tier): number;         // gem row shows tierIndex+1 gems
export function tierFirst(def: AugmentDef, tier: Tier): FirstForm;  // copy base, then: damage*mul, rate/cooldownMul, range*mul, slow.pct override; common returns {...def.first}
export function tierAdded(def: AugmentDef, tier: Tier): AddedForm;  // copy base, then replace rateMul/rangeMul/splash/slow.pct from the tier
export function tierAddedLine(def: AugmentDef, tier: Tier): string; // common: def.asAdded, else tiers[tier].asAdded

// core/augments.ts
export function towerSpec(copies: readonly AugmentCopy[]): TowerSpec;
export function towerColor(copies: readonly AugmentCopy[]): Bright | undefined;
export function rollOffer(rng: Rng, pool: readonly AugmentDef[], count: number, opening?: boolean): AugmentCopy[]; // shuffle, slice, .map((a) => ({ id: a.id, tier: rollTier(rng) }))
```
Exact `tiers` data: bolt rare `{ damageMul: 1.3, cooldownMul: 0.85, asAdded: 'One more shot each attack.' }`, epic `{ damageMul: 1.7, cooldownMul: 0.7, asAdded: 'One more shot each attack.' }` · rapid rare `{ damageMul: 1.3, cooldownMul: 0.85, addedRateMul: 1.65, asAdded: 'Attacks 65% faster, hits 25% lighter.' }`, epic `{ damageMul: 1.7, cooldownMul: 0.7, addedRateMul: 1.85, asAdded: 'Attacks 85% faster, hits 25% lighter.' }` · reach rare `{ damageMul: 1.3, cooldownMul: 0.85, rangeMul: 1.15, addedRangeMul: 1.45, asAdded: '45% more range.' }`, epic `{ damageMul: 1.7, cooldownMul: 0.7, rangeMul: 1.35, addedRangeMul: 1.55, asAdded: '55% more range.' }` · splash rare `{ damageMul: 1.3, cooldownMul: 0.85, splash: 1.5, asAdded: 'Hits burst over 1.5 cells.' }`, epic `{ damageMul: 1.7, cooldownMul: 0.7, splash: 2, asAdded: 'Hits burst over 2 cells.' }` · frost rare `{ cooldownMul: 0.85, slowPct: 0.5, asAdded: 'Hits slow enemies by 50%.' }`, epic `{ cooldownMul: 0.7, slowPct: 0.6, asAdded: 'Hits slow enemies by 60%.' }`

### Steps
1. types → 2. augment `tiers` data → 3. `core/tiers.ts` → 4. `core/augments.ts` → 5. `core/run.ts` + `config.ts` → 6. RunFlow, Building, TowerSystem → 7. `Tower.ts` → 8. HandBar/TowerPanel conform → 9. gem texture → 10. DraftScene → 11. invariant → 12. tests → 13. `npm run check` then `npm run smoke`.
DraftScene: odds line `TIER_ORDER.map((t) => `${t.charAt(0).toUpperCase() + t.slice(1)} ${TIER_ODDS[t]}`).join(' · ')` in `textStyle(12, PALETTE.muted)` — portrait at `(width/2, top + 58)`, landscape at `(width/2, height/2 - CARD_H/2 - 18)`. Per card: frame as a `Graphics` added AFTER the button, positioned with the card in `layout()`: `lineStyle(2, tier === 'rare' ? PALETTE.blue : PALETTE.purple, 1); strokeRoundedRect(-CARD_W/2 - 1, -CARD_H/2 - 1, CARD_W + 2, CARD_H + 2, 23)` (common: none). Gem row at y -17, spaced 12, `artScale(this.add.image(x, -17, GEM_TEXTURE))` + `setTint(faint | blue | purple)` for 1/2/3 gems. Shift content up: icon (0,-72), name (0,-37), `towerLine` top y -2 (addedLine formula unchanged); addedLine text = `tierAddedLine(def, copy.tier)`; name unchanged; `finishDraft(offered[i])`.

### Pitfalls
- `towerSpec`/`takeAugment`/`useAugment` signature changes break every call site; the compiler lists them — the list above is exhaustive. Never call `getAugment(copy)` where a copy is now passed (`HandBar`, `TowerPanel`, `Tower.drawPips`).
- `tierFirst`/`tierAdded` must return NEW objects (`{...}` plus a copied `slow`) — never mutate `def.first`/`def.added`, or every copy of that augment changes.
- `finishDraft` must match on id AND tier against `offer`; `rollTier` uses the seeded `run.rng` (via `rollOffer`), never `Math.random()`.
- The 2px frame behind the button's white card would show only 1px — add the frame graphics after the button so it draws on top. Hover lift (≤2px) without the frame is acceptable.
- Don't "fix" `speedUps` in `towerLook.ts`: the log/1.5 rounding already absorbs 1.65/1.85 (1.65→1, 1.85→1); leave that file untouched (T010's territory).
- Keep HandBar/TowerPanel edits to the `.id` conformance only — T0008 (hand/panel rarity) and T010 (tower pips) layer on exactly these files and must run AFTER this task.

### Tests
- `tests/core/augments.test.ts`: helper `const copy = (id: string, tier: Tier = 'common'): AugmentCopy => ({ id, tier })`; `spec(...ids)` maps ids through `copy`. New `describe('tiers')`: Rare Rapid as tower → damage 6.5, rate `toBeCloseTo(4 / 0.85)` (Epic: 8.5, `4 / 0.7`); Rare Rapid added to a Bolt tower → rate `1.6 * 1.65`, damage still `12 * 0.75`; Reach added → range `2.6 * 1.45` / `2.6 * 1.55`; Splash added → splash 1.5/2; Rare Frost first → `slow.pct 0.5`; `tierAddedLine(rapid, 'rare')` is `'Attacks 65% faster, hits 25% lighter.'`; `tierFirst(rapid, 'common')` deep-equals the base form. `rollTier` over 6000 seeded rolls: common > 0.55, epic < 0.15, epic > 0; rolling `rollOffer` across 300 seeds eventually yields both `rare` and `epic` tiers.
- `tests/content.test.ts`: in the augment loop, for each of `a.tiers.rare`/`a.tiers.epic`: `asAdded` 6–56 chars, no `first|added|alone` prefix; if present `damageMul`/`rangeMul`/`addedRateMul`/`addedRangeMul` > 1, `0 < cooldownMul < 1`, `0 < slowPct < 1`, `splash > 0`.
- `tests/core/run.test.ts`: `takeAugment({ id: 'frost', tier: 'common' })` / `{ id: 'bolt', tier: 'rare' }`; `useAugment(0)` toEqual the frost copy; hand toEqual `[{ id: 'bolt', tier: 'rare' }]`.

## Result (attempt 1, asus)

Added tiers to the draft: each augment in `content/` now carries `tiers` (Rare/Epic) values, the new `src/core/tiers.ts` rolls tiers at 70/25/5 and computes the effective first/added forms and card line, the run's hand/offer/towers carry `AugmentCopy` (id + tier) end to end, and the draft shows the odds line, a blue/purple 2px frame and a 1/2/3 gem row per tier. Towers built from a tiered copy keep that tier's numbers for the rest of the run (unit-tested: Rare Rapid attacks at 4/0.85 vs 4/s). `npm run check` and `npm run smoke` (desktop + phone) pass.

- Self-review: APPROVE
- Time: 125.4 min
- Self-review made fixes (kept; checks pass).

```
projects/chokepoint/game/docs/ARCHITECTURE.md      |  2 +-
 projects/chokepoint/game/src/art/icons.ts          | 10 ++-
 projects/chokepoint/game/src/art/textures.ts       |  1 +
 projects/chokepoint/game/src/config.ts             |  5 +-
 .../chokepoint/game/src/content/augments/bolt.ts   |  4 ++
 .../chokepoint/game/src/content/augments/frost.ts  |  4 ++
 .../chokepoint/game/src/content/augments/rapid.ts  |  4 ++
 .../chokepoint/game/src/content/augments/reach.ts  |  4 ++
 .../chokepoint/game/src/content/augments/splash.ts |  4 ++
 projects/chokepoint/game/src/content/types.ts      | 28 ++++++++
 projects/chokepoint/game/src/core/augments.ts      | 34 ++++++----
 projects/chokepoint/game/src/core/run.ts           | 13 ++--
 projects/chokepoint/game/src/core/tiers.ts         | 60 +++++++++++++++++
 projects/chokepoint/game/src/debug/runChecks.ts    |  7 ++
 projects/chokepoint/game/src/entities/Tower.ts     | 22 +++----
 projects/chokepoint/game/src/scenes/DraftScene.ts  | 51 +++++++++++----
 projects/chokepoint/game/src/systems/Building.ts   | 18 +++---
 projects/chokepoint/game/src/systems/RunFlow.ts    | 17 ++---
 .../chokepoint/game/src/systems/TowerSystem.ts     | 18 +++---
 projects/chokepoint/game/src/ui/hud/HandBar.ts     |  6 +-
 projects/chokepoint/game/src/ui/hud/TowerPanel.ts  |  8 +--
 projects/chokepoint/game/tests/content.test.ts     | 21 +++++-
 .../chokepoint/game/tests/core/augments.test.ts    | 75 +++++++++++++++++++++-
 projects/chokepoint/game/tests/core/run.test.ts    |  8 +--
 24 files changed, 336 insertions(+), 88 deletions(-)
```
