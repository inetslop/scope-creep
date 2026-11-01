---
id: T0383
title: The tower branch and its first node, Soft sell
assignee: desktop
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-01T21:57:55Z
claimed_at: 2026-11-01T22:18:50Z
epic: E16
---

## Goal
The tech tree gains its sixth branch, "The tower" — between-run coins buy how towers are managed — and its first node, Soft sell: a sell refunds 80% of slot cost instead of 70%, so the run's safety net (E7) is softer on every run after.

## Details
- **The row.** The tech screen gains a sixth branch row, "The tower" (the T0358 wave-branch pattern: a new branch file in the content/tech pattern, its own buy dispatch in core/tech.ts, one row in TechScene), carrying one node: **Soft sell** — 30 coins, the branch's depth-1 price under the depth rule, bought once, on for every run after.
- **The card.** The node card reads "Soft sell" with the dry one-line description "a sell pays 80% of its slots' cost, not 70%", the price line, and the owned mark when bought — the node card's own look, the branch discount/depth pricing's own behavior.
- **The effect.** While owned, the sell's refund is 80% of the tower's total slot cost instead of 70% — the sellPrice's own rounding (core/techEffects.ts), read from the owned list at the sell like every node's effect, so the panel's Sell line and the sell commit's gold pop both show the 80% number. A run without the node is byte-identical to today (70%).
- **The dot.** The menu's Tech button dot counts the new node: it shows while the profile's coins can buy at least one unowned node, Soft sell included.
- Nothing else changes: no other branch's nodes or prices, no augment, enemy, wave or board content, no other screen — the tech screen is the only new surface (one row on its existing card, the T0225 tidy-column rule keeping it fitting).

## Acceptance criteria
- [ ] The tech screen shows a sixth branch row, "The tower", with one node card: Soft sell, 30 coins, description "a sell pays 80% of its slots' cost, not 70%"; buying it spends 30 coins, wears the owned mark, and it cannot be bought again.
- [ ] In every run after the purchase, the panel's Sell line and the sell commit pay 80% of the tower's slot cost (floored, the sell's own rounding) instead of 70%; a run without the node shows exactly the old 70% numbers.
- [ ] The menu's Tech dot shows while the coins can buy Soft sell or any other unowned node, and clears when nothing is affordable.
- [ ] The tech card stays tidy and fits at 412x915 and 1280x720 with the sixth row (the layout check in the gate).
- [ ] No other branch's prices, nodes or screens change; no augment, enemy, wave or board content is touched.

## Design (architect, desktop)

### Files
- create `src/content/tech/tower.ts` - the "The tower" branch: `TowerNode` interface + `TOWER_NODES` (one node: Soft sell), modeled on `src/content/tech/wave.ts`
- edit `src/core/techEffects.ts` - `sellPrice` gains a third `owned` parameter; new `sellRefund(owned)` reader (the 7/8 per-10 rate)
- edit `src/core/tech.ts` - import `TOWER_NODES`; add it to the `nodeInReach` branch list; new `buyTowerNode` after `buyWaveNode`
- edit `src/scenes/TechScene.ts` - seventh row "The tower" (label, `rows` entry, `'tower'` in the `RowNode.branch` union, buy dispatch case, doc-comment line)
- edit `src/systems/TowerSystem.ts` - `sell()` passes the run's `techOwned` to `sellPrice`
- edit `src/ui/hud/TowerPanel.ts` - the Sell button line passes `game.run.techOwned` to `sellPrice`
- edit `tests/core/tech.test.ts` - tower-branch row/buy tests; the `nodeInReach` "every node owned" list must gain `...TOWER_NODES`
- edit `tests/core/techEffects.test.ts` - the five `sellPrice(i, j)` calls gain a `[]` third arg; new Soft-sell refund tests

### Interfaces
```ts
// src/content/tech/tower.ts (new file)
export interface TowerNode { id: string; name: string; line: string; price: number; refund: number; }
export const TOWER_NODES: readonly TowerNode[] = [
  { id: 'soft-sell', name: 'Soft sell', line: 'a sell pays 80% of its slots\' cost, not 70%', price: 30, refund: 8 },
];

// src/core/techEffects.ts
export function sellRefund(owned: readonly string[]): number; // biggest owned tower node's `refund`, 7 when none
// sellPrice signature changes: was (slots: number, discount: number)
export function sellPrice(slots: number, discount: number, owned: readonly string[]): number;

// src/core/tech.ts (clone buyWaveNode, WAVE_NODES -> TOWER_NODES, no prerequisites)
export function buyTowerNode(store: KeyValueStore | undefined, id: string): boolean;
```
`sellRefund` body: the standard dedupe loop (`seen` Set, `TOWER_NODES.find`, `if (node.refund > refund) refund = node.refund`), starting `refund = 7`. `sellPrice` body stays `Math.floor((paid * sellRefund(owned)) / 10)` — integer tenths, NOT `* 0.8`.

### Steps
1. Create `src/content/tech/tower.ts` exactly as above (file comment: the branch that changes how the run's towers are sold back).
2. `src/core/techEffects.ts`: add `import { TOWER_NODES } from '../content/tech/tower';` with the other content imports; add `sellRefund` above `sellPrice`; change `sellPrice` to take `owned` and use `sellRefund(owned)` in the floor expression (update its doc comment: 80% with Soft sell, 70% without).
3. `src/core/tech.ts`: add the `TOWER_NODES` import (line with `WAVE_NODES`); in `nodeInReach` change the list to `[TECH_NODES, POOL_NODES, CLAIM_NODES, BOARD_NODES, WAVE_NODES, TOWER_NODES]`; append `buyTowerNode` at the end of the file (copy `buyWaveNode`, swap `WAVE_NODES` for `TOWER_NODES`, doc: "a tower node has no prerequisites and no gate — its effect is in every run the moment it is bought").
4. `src/systems/TowerSystem.ts:178`: `sellPrice(tower.slots, this.run.slotDiscount, this.run.techOwned)` (RunState's field is `techOwned`, `core/run.ts:25`).
5. `src/ui/hud/TowerPanel.ts:151`: `sellPrice(tower.slots, game.run.slotDiscount, game.run.techOwned)`.
6. `src/scenes/TechScene.ts`: import `TOWER_NODES` (with the other tech imports) and `buyTowerNode` (with the other `core/tech` imports); add `| 'tower'` to the `RowNode.branch` union; append `'The tower'` to `ROW_LABELS` (after `'The wave'`); append one row to `rows` after the wave row: `TOWER_NODES.map((n) => ({ id: n.id, name: n.name, line: n.line, price: n.price, requires: null, unlocks: null, branch: 'tower' })),`; in `buy()` insert `: node.branch === 'tower' ? buyTowerNode(window.localStorage, node.id)` between the wave case and the final `buyBoardNode` fallback; doc comment: "Six branches" becomes "Seven branches" and the list gains `and "The tower" (how the run's towers are sold back)`.
7. `tests/core/tech.test.ts`: import `TOWER_NODES` and `buyTowerNode`; after the wave-branch tests add (model on the wave ones, `withCoins` helper already exists): a row-shape test (`TOWER_NODES.map((n) => [n.id, n.name, n.line, n.price, n.refund])` equals one entry as above), a buy-gate test (unknown/`nope`, 29 coins unaffordable, already owned), a deducts-30 test; add `expect(nodeCost(TOWER_NODES, 'soft-sell')).toBe(30);` to the `nodeCost` test (line 297); in the dot test change line 313's list to include `...TOWER_NODES` (also line 314's `allButTwo` list, so soft-sell counts as owned there).
8. `tests/core/techEffects.test.ts`: import `TOWER_NODES` (not strictly needed) and `sellRefund`; add `[]` as third arg to the five `sellPrice` calls in the 70% test; add a test: `sellRefund([])` is 7, `sellRefund(['soft-sell'])` is 8, `sellRefund(['gold-1'])` is 7, `sellRefund(['soft-sell', 'soft-sell', 'nope'])` is 8; and `sellPrice(1, 0, ['soft-sell'])` is 32, `sellPrice(MAX_SLOTS, 0, ['soft-sell'])` is 536, `sellPrice(2, 10, ['soft-sell'])` is 80.
9. `npm run check` must pass.

### Pitfalls
- Every `sellPrice` call site must gain the third arg or the build fails — exactly two in src (TowerSystem, TowerPanel) and five in `techEffects.test.ts`; grep `sellPrice` to be sure.
- Keep `Math.floor((paid * refund) / 10)` with an integer refund — `paid * 0.8` reintroduces the float-short the comment warns about.
- If `'tower'` is missing from the `RowNode.branch` union or the dispatch, the buy silently falls through to `buyBoardNode` (nothing happens) — add both.
- The price shown on the card comes from `nodeCost(row, node.id)` on the scene's own row, so the row must be built from `TOWER_NODES` for depth-1 = 30 to display.
- Don't touch `slotPrice`, `slotCost`, other branch files, GameScene, RunState or save/resume — the effect is read from `run.techOwned` (always the current profile's purchased list), so resumed runs pick it up for free and no-run nodes stay byte-identical at 70%.
- Layout is content-driven (passes A–B of `TechScene.rebuild`): the new single-card row costs one label + one 160 px card + gaps; no hand-picked y exists to break. A single-card narrow row centers itself (`lastOdd` rule); overflow, if any, uses the existing scroll + down arrow.

### Tests
- `tests/core/tech.test.ts`: tower row shape; `nodeCost(TOWER_NODES, 'soft-sell')` = 30; `buyTowerNode` gates (unknown, 29 coins, already owned) and deducts 30; `nodeInReach` lists include `TOWER_NODES` (soft-sell counts for the dot).
- `tests/core/techEffects.test.ts`: `sellRefund` (7 default, 8 with soft-sell, other-branch and duplicate ids ignored); `sellPrice` with `[]` stays 28/77/70/469 and with `['soft-sell']` pays 32/80/536.
- `npm run check` (typecheck + lint + unit tests) must pass.
