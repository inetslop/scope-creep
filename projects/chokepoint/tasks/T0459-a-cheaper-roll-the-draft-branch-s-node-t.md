---
id: T0459
title: "A cheaper roll: the draft branch's node that starts the reroll 25 lower"
size: M
priority: 2
status: todo
depends_on: [T0458]
attempts: 0
created: 2026-11-03T01:27:12Z
epic: E23
---

## Goal
Between-run coins can buy a cheaper draft reroll: the tech tree's "The draft" branch gains a node that lowers the reroll's cost curve by 25, so a run that rerolls often spends less gold on each one.

## Details
- The node sits on the tech screen's existing "The draft" row (the branch holding Slot II −5, Slot II −5, Fourth card and The early odds) as the branch's fifth node, depth 5: 110 coins by the branch's own depth rule (base 10 — the row's prices read 10, 30, 50, 80, 110). Bought once, on for every run after, like the row's other nodes.
- Today's reroll is unlimited on the curve 50 + 15n + 5n² (n the rerolls already used this run): 50, 70, 100, 140, 190, … With the node owned, every reroll costs 25 less: 25, 45, 75, 115, 165, … (25 + 15n + 5n²). A run's first reroll reads 25 gold instead of 50.
- The draft's reroll button keeps its own look and shows the live price; with the node owned it reads the lowered curve. Without the node the prices are byte-identical to today.
- The node's card wears the row's own card language: the name "A cheaper roll", a description naming the lowered start ("rerolls start at 25 gold: 25, 45, 75, …"), the 110 price, the owned mark once bought. The row's existing four nodes and the rest of the tech screen are untouched.
- The owned state rides the profile's tech list like the branch's other nodes: a run started after the buy reads the lowered curve from its first reroll. The tree is only reachable between runs, so nothing changes mid-run.

## Acceptance criteria
- [ ] The tech screen's draft row shows the fifth node "A cheaper roll" at 110 coins, buyable through the row's own buy flow, wearing the owned mark after the buy.
- [ ] In a run with the node owned, the reroll button prices rerolls 25, 45, 75, 115, 165, … (first reroll 25, not 50).
- [ ] In a run without the node, the reroll prices are exactly today's 50, 70, 100, 140, 190, ….
- [ ] The lowered curve is read from the first reroll of the first run after the buy; no mid-run change.
- [ ] A resumed run with the node owned still reads the lowered curve.
- [ ] Unit tests cover the curve with and without the node, the depth-5 price of 110, and the buy/owned state.

## Design (architect, cachyos-x8664)

### Files
- edit `src/content/tech/draft.ts` — extend `DraftNode.kind` to `'slot2' | 'fourth' | 'reroll'` and append the fifth node (after T0458's fourth node, "The early odds").
- edit `src/core/techEffects.ts` — add `rerollDiscount(owned)` and `rerollPrice(owned, n)` (imports `rerollCost` from `./config`); do not touch `DraftTech` or `draftTech`.
- edit `src/core/run.ts` — `reroll()` pays the lowered price; swap the `rerollCost` import for `rerollPrice`.
- edit `src/scenes/DraftScene.ts` — the button's two price reads swap to `rerollPrice(...)`; swap the line-3 import.
- edit `tests/core/techEffects.test.ts` — extend the draft-row list test, add the buy test and the curve tests.
- edit `tests/core/run.test.ts` — the charged-curve test with the node owned.

### Interfaces
```ts
// src/content/tech/draft.ts — the exact fifth entry (appended after T0458's entry):
{ id: 'cheaper-roll', name: 'A cheaper roll', line: 'rerolls start at 25 gold: 25, 45, 75, …', price: 110, requires: null, kind: 'reroll' }
// and the widened field:
kind: 'slot2' | 'fourth' | 'reroll';

// src/core/techEffects.ts — new exports (module already imports DRAFT_NODES from '../content/tech/draft'):
/** The reroll's discount for the owned draft node: 25 with "A cheaper roll", 0 without; each node counts once, unknown ids count for nothing. */
export function rerollDiscount(owned: readonly string[]): number {
  let discount = 0;
  const seen = new Set<string>();
  for (const id of owned) {
    if (seen.has(id)) continue;
    seen.add(id);
    const node = DRAFT_NODES.find((n) => n.id === id);
    if (!node) continue;
    if (node.kind === 'reroll') discount = 25;
  }
  return discount;
}
/** The run's n-th reroll, the curve with the owned node's discount: 25, 45, 75, 115, … with "A cheaper roll"; today's curve without. */
export function rerollPrice(owned: readonly string[], n: number): number {
  return rerollCost(n) - rerollDiscount(owned);
}
// plus one import line: import { rerollCost } from './config';
```

### Steps
1. `src/content/tech/draft.ts`: widen `kind` (add `| 'reroll'`), append the entry above as the fifth element of `DRAFT_NODES`. `requires: null` (the `fourth-card` precedent: independent nodes lock nothing). Its live price is `nodeCost(DRAFT_NODES, 'cheaper-roll')` = `nodePrice(10, 5)` = 110; the `price: 110` field is the doc, as in the other entries.
2. `src/core/techEffects.ts`: add `import { rerollCost } from './config';` and the two functions above (they can go after `draftCardsFor`, end of file).
3. `src/core/run.ts` line 116: `if (!this.spend(rerollPrice(this.techOwned, this.rerollsUsed))) return false;`; line 1 becomes `import { START, WAVE_BONUS } from '../config';` and add `import { rerollPrice } from './techEffects';` (no import cycle: techEffects only reaches content/ and core/augments).
4. `src/scenes/DraftScene.ts`: line 3 becomes `import { rerollPrice } from '../core/techEffects';` (drop the `rerollCost` import — its only uses were the two below); line 297 `String(rerollPrice(game.run.techOwned, game.run.rerollsUsed))`; line 305 `const cost = rerollPrice(game.run.techOwned, game.run.rerollsUsed);`.
5. `tests/core/techEffects.test.ts`: the node-list test (line 22) must end with T0458's fourth entry and then `['cheaper-roll', 'A cheaper roll', 110, null, 'reroll']`. Add:
```ts
it('the cheaper roll buys only when it is affordable, deducts the branch's own depth-5 price, and saves the id', () => {
  const broke = withCoins(109);
  expect(buyNode(broke, 'cheaper-roll')).toBe(false);
  expect(loadProfile(broke).coins).toBe(109);
  const store = withCoins(110);
  expect(buyNode(store, 'cheaper-roll')).toBe(true);
  expect(loadProfile(store).coins).toBe(0);
  expect(loadProfile(store).purchased).toEqual(['cheaper-roll']);
});
it('rerolls price the plain curve without the node: 50, 70, 100, 140, 190, 250, 320', () => {
  for (const [n, price] of [[0, 50], [1, 70], [2, 100], [3, 140], [4, 190], [5, 250], [6, 320]] as const) expect(rerollPrice([], n)).toBe(price);
});
it('the owned node drops every reroll by 25: 25, 45, 75, 115, 165, 215; unknown and duplicate ids count for nothing', () => {
  expect(rerollDiscount([])).toBe(0);
  expect(rerollDiscount(['cheaper-roll'])).toBe(25);
  expect(rerollDiscount(['cheaper-roll', 'cheaper-roll', 'nope'])).toBe(25);
  for (const [n, price] of [[0, 25], [1, 45], [2, 75], [3, 115], [4, 165], [5, 215]] as const) expect(rerollPrice(['cheaper-roll'], n)).toBe(price);
});
```
(extend the line-7 import to pull `rerollPrice`/`rerollDiscount` from techEffects and `nodeCost` from `core/tech` if the list test also asserts `nodeCost(DRAFT_NODES, 'cheaper-roll')` is 110 — the list test's price field is enough; pick one).
6. `tests/core/run.test.ts` (next to the "rerolls charge the run's curve" test, ~line 96): build the run with the node in its `purchased` list (constructor `new RunState(seed, ['cheaper-roll'], 2)`), gold 30 → `reroll()` true, gold 5, `rerollsUsed` 1; gold 24 → false (45 the second reroll).

### Pitfalls
- Do not persist anything: `RunSave`/`SavedRun` round-trip neither `slotDiscount` nor `fourthCard`, so the discount must read from `run.techOwned` (set at `new RunState(seed, purchased, bgen)` in GameScene for every run, resumed included) — never from `run.slotDiscount` or the save file. That is why `rerollPrice(owned, n)` takes `owned`.
- `draftTech()`/`DraftTech` are only re-read for new runs (the `if (!saved)` block in GameScene); reaching for them here would silently break resumed runs.
- The first reroll of the first run after the buy reads 25 because the discount is computed per reroll from the fixed `techOwned`; there is no mid-run change and no run field to migrate.
- Never negative: the discount is 25 and the curve's minimum is 50, so no `Math.max` floor is needed; do not invent one.
- `rerollCost` stays byte-identical (config.test.ts pins 50/70/100/140/190/250/320); the button without the node must show today's prices, so keep the plain curve path exact.
- DraftScene's smoke mode disables the button (line 316) and never pays — unchanged; the hotkey `R` still routes through `reroll()` → `run.reroll()`.
- `TechScene` needs no edit: the row renders `DRAFT_NODES` and `buyNode` already accepts draft ids; the fifth card appears at the branch's own depth-5 price.

### Tests
- `tests/core/techEffects.test.ts`: row ends `['cheaper-roll', 'A cheaper roll', 110, null, 'reroll']`; buy at 110 deducts and saves, 109 refuses; `rerollPrice([], n)` = 50/70/100/140/190/250/320; `rerollPrice(['cheaper-roll'], n)` = 25/45/75/115/165/215; `rerollDiscount` 0/25 with duplicate and unknown-id guards.
- `tests/core/run.test.ts`: owned node charges 25 then 45 (the lowered curve through `run.reroll()`), unaffordable pays nothing.
- `npm run check` (typecheck + lint + unit tests) and `npm run smoke`.
