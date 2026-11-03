---
id: T0462
title: "Opening wild: the draft branch's node that gives the first draft a Rare or better"
size: M
priority: 2
status: todo
depends_on: [T0458, T0459]
attempts: 0
created: 2026-11-03T02:05:22Z
epic: E23
---

## Goal
Between-run coins buy how the run's cards come: the tech tree's existing "The draft" branch gains its sixth node, which once owned gives every run's first draft a Rare or better card alongside its Common Bolt floor (T0048) — the run's opening build starts a tier higher.

## Details
- A node on the existing branch, not a new row: the tech screen's "The draft" row — the 2nd row, home of the two Slot II −5 nodes, Fourth card, The early odds (T0458) and A cheaper roll (T0459) — shows one more node card at the end: **Opening wild**, the branch's sixth node, depth 6: 145 coins by the branch's own depth rule (base 10 — the row's prices read 10, 30, 50, 80, 110, 145). The node is appended last in the row's data, after A cheaper roll — the row's order is its depth (inserting it earlier re-prices the nodes ahead of it, T0458's trap). Bought once, on for every run after, bought independently of the row's other nodes (no gate — the branch's existing rule).
- The effect (on for every run started after the buy): every offer the pre-wave-1 draft presents — the first one and its rerolls — carries a Rare floor on one card: the slot right after the Common Bolt's slot (T0048) rolls its tier as usual but never comes out Common; a rolled Common reads as Rare. The opening offer is therefore always: the Common Bolt, one card that is Rare or better (Epic at the roll's own odds), and one card at the normal odds. The augment in the floored slot is still rolled from the same pool by the same rules — the floor changes the tier only.
- With The early odds owned (T0458), the floored slot rolls at the shifted odds and still floors at Rare; without it, at the flat 70/25/5.
- The opening draft is the only draft a run ever rolls before a save exists: a resumed run picks up at the build or wave phase, never at the opening draft. The effect is confined to run start and needs no mid-run state — no field on the run, nothing in the run save; a resumed run can neither gain it nor lose it.
- The node's card wears the row's own card language: the name "Opening wild", a dry one-liner naming the floor ("the first draft always offers a Rare or better"), the 145 price, the owned mark once bought. The row's existing five nodes and the rest of the tech screen are untouched; the row lays out the sixth card the way the run-start row lays out its five (two per grid row in narrow mode).
- The offer's rest is unchanged: the card count, the no-repeat rule, the reroll, the odds line (it names the other slots' roll), the tier chime and the Epic frame shimmer — the floored card still reveals, chimes and shimmers as its rolled tier.

## Acceptance criteria
- [ ] The tech screen's "The draft" row shows Opening wild as its sixth node — 145 coins by the branch's depth rule, the one-liner, the branch's node look; buying it spends between-run coins and it wears the owned mark; the six-card row fits at 412x915 and 1280x720.
- [ ] In a run started after the buy, every pre-wave-1 offer (the first and its rerolls) carries a Rare-or-better card in the slot right after the Common Bolt's: a rolled Common in that slot reads as Rare, a rolled Epic stays Epic; the other non-Bolt slot rolls at the normal odds.
- [ ] With The early odds owned, the floored slot rolls at the shifted odds and floors at Rare; the opening offer composes with it otherwise unchanged.
- [ ] In a run without the node, the opening offer is exactly today's: the Common Bolt plus two cards at the flat 70/25/5 (or the shifted odds with The early odds owned).
- [ ] Drafts from wave 1 on are byte-identical with and without the node.
- [ ] No run-save state is added for the node: a resumed run never rolls the opening draft, so the node cannot activate mid-run or after a resume.
- [ ] The floored card reveals, chimes and shimmers as its rolled tier; the odds line, card count, no-repeat rule and the opening Bolt floor are untouched.
- [ ] Unit tests cover the depth-6 price of 145, the buy/owned state, the opening offer with and without the node (Common in the floored slot reads Rare, Epic passes through), and the composition with The early odds.

## Design (architect, desktop)

### Files
- edit `src/content/tech/draft.ts` - extend `kind` union with `'wild'`; append the Opening wild node LAST in `DRAFT_NODES`
- edit `src/core/techEffects.ts` - add `openingWild: boolean` to `DraftTech`; set it in `draftTech()` for `kind === 'wild'`
- edit `src/core/augments.ts` - `rollOffer()` gains a final `openingWild = false` parameter and floors one slot
- edit `src/systems/RunFlow.ts` - import `draftTech`; pass the flag at both `rollOffer` call sites (openDraft, rerollOffer)
- edit `tests/core/techEffects.test.ts` - row test, `draftTech` expectations, owned-state and 145-price buy tests
- edit `tests/core/augments.test.ts` - floor tests in the `rollOffer` describe block

### Interfaces
```ts
// content/tech/draft.ts — kind union and appended node (last entry of DRAFT_NODES):
kind: 'slot2' | 'fourth' | 'wild';
{ id: 'opening-wild', name: 'Opening wild', line: 'the first draft always offers a Rare or better', price: 145, requires: null, kind: 'wild' }

// core/techEffects.ts — new field, function signature unchanged:
export interface DraftTech { slotDiscount: number; fourthCard: boolean; openingWild: boolean }

// core/augments.ts — parameter appended LAST (T0458, built first, may have added its own trailing parameter — after that one):
export function rollOffer(rng: Rng, pool: readonly AugmentDef[], count: number, wave: number, opening = false, exclude?: readonly string[], openingWild = false): AugmentCopy[]
```
`rollOffer` body: after the opening-Bolt push, capture `const firstRoll = offers.length;` and loop `for (let i = firstRoll; i < count; i++)`; after the existing wildcard line add `if (opening && openingWild && i === firstRoll && tier === 'common') tier = 'rare';` (the floor clamps, it never re-rolls or consumes rng). Add one doc-comment sentence: with `openingWild` the opening offer's first rolled card — the slot right after the Common Bolt's — never comes out Common; a rolled Common reads as Rare, a rolled Epic stays Epic.
RunFlow call sites become: `rollOffer(this.run.rng, draftPool(this.run.techOwned), draftCardsFor(this.draftWave, this.run.fourthCard), this.draftWave, this.run.wave === 0, this.lastOffer, draftTech(this.run.techOwned).openingWild)` (both line ~143 and ~158); extend the existing `import { draftCardsFor } from '../core/techEffects';` with `draftTech`.

### Steps
1. `draft.ts`: extend the union + its doc line, append the node after `fourth-card` (and after T0458/T0459's nodes, which are already there), extend the `DRAFT_NODES` header comment with "and Opening wild, which floors the pre-wave-1 draft's first rolled card at Rare".
2. `techEffects.ts`: add the interface field (doc: "The pre-wave-1 draft's first rolled card never comes out Common (a rolled Common reads as Rare)."), `let openingWild = false;`, `if (node.kind === 'wild') openingWild = true;`, add to the return.
3. `augments.ts`: the parameter, `firstRoll`, the floor line, the doc sentence.
4. `RunFlow.ts`: import + the two call sites.
5. `tests/core/techEffects.test.ts`: (a) in the existing row-shape test (`the draft row is one branch…`), append `['opening-wild', 'Opening wild', 145, null, 'wild']` as the 6th expected entry; (b) `toEqual` is shape-exact — add `openingWild: false` to every existing `draftTech(...)` expectation (the `draftTech([])` one and the "counts each node once" four); (c) new test: `draftTech(['opening-wild']).openingWild` true, `draftTech(['opening-wild','opening-wild','nope'])` true, other-branch ids false; (d) new test: `nodeCost(DRAFT_NODES, 'opening-wild')` is 145 (add `nodeCost` to the `core/tech` import); `buyNode(withCoins(144), 'opening-wild')` false with coins untouched; `buyNode(withCoins(145), 'opening-wild')` true with `purchased` containing it and coins 0; buying again false (owned).
6. `tests/core/augments.test.ts` in `describe('rollOffer')`: (a) 300 seeds: `plain = rollTier(new Rng(seed), 1)` (the offer's first tier draw) and `offer = rollOffer(new Rng(seed), AUGMENTS, 3, 1, true, undefined, true)` → `offer[1].tier` equals `plain === 'common' ? 'rare' : plain` (pins Common-reads-as-Rare and Epic-passthrough exactly); (b) without the flag (`…, undefined, false`), `offer[1].tier === 'common'` occurs in some of 300 seeds; (c) with the flag, `offer[0]` is `{ id: 'bolt', tier: 'common' }` every time and `offer[2].tier === 'common'` occurs in some of 300 seeds (the other slot is unfloored); (d) rerolls: first offer, then `rollOffer(…, true, first.map(c => c.id), true)` → floored slot is `rerolled[rerolled[0].id === 'bolt' ? 1 : 0]`, never 'common', while the next slot is 'common' in some of 200 seeds; (e) composition with the shifted odds: 300 seeds of `rollOffer(new Rng(seed), AUGMENTS, 3, 5, true, undefined, true)` (wave-5 odds are the shifted set The early odds brings to the opening draft) → `offer[1].tier` never 'common' and 'epic' occurs at least once; (f) byte-identity: 100 seeds, `rollOffer(new Rng(seed), AUGMENTS, 3, 7, false, undefined, true)` `toEqual` the same call without the flag.
7. `npm run check`, then `npm run smoke`.

### Pitfalls
- Never insert the node before the T0458/T0459 nodes: `nodeCost` prices by array position — earlier = re-priced. Append last only.
- The new `rollOffer` parameter goes at the END — many existing call sites (incl. `tests/core/zz-t0279-probe.test.ts`) pass positional args.
- No field on `RunState`, no save change, no GameScene change: the flag is derived from `run.techOwned` per roll. A resumed run never re-rolls the pre-wave-1 draft, so the node cannot activate mid-run.
- Guard the floor with `opening &&` so wave-1+ drafts are byte-identical; the floor must not consume rng.
- No DraftScene, TechScene, buy-path or save code changes: TechScene maps `DRAFT_NODES` generically (6 cards = 3 narrow grid rows / one 860 px wide row, both fit; panel already scrolls when tall), `buyNode`/`nodeCost`/owned-mark are generic, and reveal/chime/shimmer all key off `copy.tier`, which the floor already fixed.
- T0458 is built first and may have changed `rollTier`/`rollOffer` signatures — read them as they are at build time and keep the test's `rollTier(new Rng(seed), 1)` prediction call matching.
- The node's `price: 145` data field is vestigial (display and purchase use `nodeCost`) but set it to the true depth-6 price anyway.

### Tests
- As specified in Steps 5–6: depth-6 price 145, buy/owned state (no gate, exact deduction), the opening offer with and without the node (Common-in-slot reads Rare, Epic passes through, other slot flat), reroll floored slot, composition with the shifted odds, and byte-identical non-opening drafts.
