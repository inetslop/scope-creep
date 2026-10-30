---
id: T0288
title: "The tech tree's depth price: nodes cost more the deeper they are"
size: M
priority: 1
status: todo
depends_on: []
attempts: 0
created: 2026-10-30T16:07:56Z
epic: E9
---

## Goal
The tree gets a bigger sink to match the coming level-augment coin boost: a node's price is derived from its depth in its branch (superlinear, not exponential), and the branch discount goes.

## Details
- A new pure function in src/core/tech.ts: `nodePrice(base, depth)` = `base × depth^1.5` rounded to the nearest multiple of 5 (halves round up). depth is the node's 1-based position in its branch (the branch's first node is depth 1).
- Each branch's base is its first node's current stored price. A depth-k node's displayed and purchase price becomes `nodePrice(branchBase, k)`, and the stored prices of depth-2-and-deeper nodes are no longer read. Resulting shapes: the pool branch (base 25) reads 25, 70, 130; the board branch (base 30) reads 30, 85; the claim branch (base 30) reads 30; the run-start branch's five nodes read round5(base × k^1.5) for k = 1..5 (with its base of 10 that is 10, 30, 50, 80, 110).
- The branch discount (5/10 off the 2nd/3rd node, T0214) is removed wherever it is computed or shown, and the card's struck-through old-price line goes with it (one in, one out: the price line keeps its slot and shows one number).
- No new nodes in this task (deeper nodes priced on this curve come in a later slice). Owned nodes stay owned exactly as saved; a buy spends the derived price; the Tech button's affordability dot (T0213) recomputes from the derived prices; the coin formula, the pause worth line and the claim recipe are untouched.
- Card text still fits at 412x915 and 1280x720 with the longest derived price (a 3-digit number like 130).

## Acceptance criteria
- [ ] `nodePrice` has unit tests: (10,1..5) → 10, 30, 50, 80, 110; (25,2) → 70; (25,3) → 130; (30,2) → 85; rounding to the nearest multiple of 5.
- [ ] In the Tech scene every unowned node's price line shows the derived price with no struck-through old price; each branch's first node shows exactly the same number as before this task.
- [ ] Buying a 2nd/3rd node spends the derived price (pool branch: 70/130, not 25/20); a profile that already owns a node loads with it owned, at no cost.
- [ ] The menu's Tech button dot appears exactly when any unowned node is affordable at its derived price.
- [ ] The gate passes (typecheck, lint, unit tests, browser smoke test).

## Design (architect, desktop-4070)

### Files
Edit `src/core/tech.ts`, `src/scenes/TechScene.ts`, `tests/core/tech.test.ts`, `tests/core/techEffects.test.ts`. Do NOT edit `src/content/tech/*.ts` (stored prices stay as data), `src/core/profile.ts`, `src/core/techEffects.ts`, `src/scenes/MenuScene.ts` (`nodeInReach` signature is unchanged), or CLAUDE.md. No new files, no npm deps.

### Interfaces
Replace `ownedInBranch` + `branchPrice` in `src/core/tech.ts` (lines 75–84) with:
```ts
/** A branch's first-node price scaled by depth^1.5 and rounded to the nearest multiple of 5 (halves up). */
export function nodePrice(base: number, depth: number): number {
  return Math.round((base * Math.pow(depth, 1.5)) / 5) * 5;
}

/** One node's price now: its branch's first-node base, at the node's 1-based position in the branch. */
export function nodeCost(branch: readonly { id: string; price: number }[], id: string): number {
  return nodePrice(branch[0].price, branch.findIndex((n) => n.id === id) + 1);
}
```
Derived prices (base = first node's stored price, depth = array position, 1-based): run-start 5,15,25,40,55 · draft 10,30,50 · pool 25,70,130 · claim 30 · board 30,85.

### Steps
1. `src/core/tech.ts`: in `buyNode` line 96, `buyPoolNode` 116, `buyClaimNode` 148, `buyBoardNode` 169 replace the price line with `const price = nodeCost(branch, id);` (in `buyNode` the existing `branch` variable is the picked TECH_NODES/DRAFT_NODES array; else `POOL_NODES`/`CLAIM_NODES`/`BOARD_NODES`). Rewrite `nodeInReach` (132–137) as:
```ts
export function nodeInReach(purchased: readonly string[], coins: number): boolean {
  for (const branch of [TECH_NODES, POOL_NODES, CLAIM_NODES, BOARD_NODES]) {
    for (const node of branch) {
      if (!purchased.includes(node.id) && coins >= nodeCost(branch, node.id)) return true;
    }
  }
  return false;
}
```
2. `src/scenes/TechScene.ts`: import line 10 → `import { buyBoardNode, buyClaimNode, buyNode, buyPoolNode, nodeCost, TECH_NODES } from '../core/tech';`. Delete `TechCard` fields `full` (line 40) and `strike` (41). Pass A line 177 → `String(nodeCost(row, node.id))` (`row` is the map callback param at 168). Pass C: delete lines 236–237; line 239 → `button.content.add([m.name, m.desc, m.price, nodeCoin]);`; line 243 → `this.cards.push({ node, button, price: m.price, coin: nodeCoin, border, h: m.h });`. In `refresh()`: delete line 281 (`ownedCount`), line 282 → `const now = nodeCost(row, c.node.id);`; delete each `c.full.setVisible(false); c.strike.setVisible(false);` pair (lines 291–292, 298–299, 305–306); merge the last two branches (308–331) into one:
```ts
      } else {
        c.price.setText(String(now)).setColor(cssColor(afford ? PALETTE.ink : PALETTE.red));
        const w = 20 + c.price.width;
        c.coin.x = -w / 2 + 6;
        c.price.x = -w / 2 + 20;
        c.coin.setVisible(true);
        c.button.content.setAlpha(afford ? 1 : 0.6);
      }
```
Keep `RowNode.price`, the rows' `price: n.price` (lines 81–85), line 333, and the rowDots loop unchanged.
3. `tests/core/tech.test.ts`: import line 6 → drop `branchPrice`, `ownedInBranch`; add `nodeCost, nodePrice`. Delete the `branchPrice` test (207–214) and `ownedInBranch` test (216–220); add:
```ts
it('nodePrice rounds base × depth^1.5 to the nearest multiple of 5 (halves up)', () => {
  expect(nodePrice(10, 1)).toBe(10);
  expect(nodePrice(10, 2)).toBe(30);
  expect(nodePrice(10, 3)).toBe(50);
  expect(nodePrice(10, 4)).toBe(80);
  expect(nodePrice(10, 5)).toBe(110);
  expect(nodePrice(25, 2)).toBe(70);
  expect(nodePrice(25, 3)).toBe(130);
  expect(nodePrice(30, 2)).toBe(85);
});

it('nodeCost: the first node is the base, later nodes scale by their position', () => {
  expect(nodeCost(TECH_NODES, 'gold-1')).toBe(5);
  expect(nodeCost(TECH_NODES, 'life-2')).toBe(55);
});
```
Update coins math: "full chain of five" → `withCoins(150)`, remainder `10` (comment: "5, then 15, 25, 40 and 55 at their depth"). Pool test (110–123): `store2 = withCoins(100, ['haste'])` (coins→`30`, comment "momentum at 70"); `store3 = withCoins(145, [...])` (coins→`15`, comment "mend at 130"); line 97 comment `29 < 70`, line 103 comment `29 < 130`. Board test (180–188): retitle "…at the depth price: 85 coins with one owned, 84 refuses"; `withCoins(85, …)`/`withCoins(84, …)`, comment "unaffordable: 84 < 85". "a later node" (222–229): retitle "a later node buys at its depth price, deducted from the coins"; `s = withCoins(100, ['gold-1'])` → coins `85` (comment "gold-2 at 15"); `s2 = withCoins(60, […3 owned])` → coins `20` (comment "life-1 at 40, its fourth depth"). All other tests pass unchanged.
4. `tests/core/techEffects.test.ts` only the purchase test (70–79) → `withCoins(95)`, coins `85`, buy slot2-2 → `55` (comment "slot2-2 at 30"), buy fourth-card → `5` (comment "fourth-card at 50"), same purchased list. Every other test passes unchanged (the `withCoins(9)` broke case: derived slot2-1 is 10, so 9 < 10 still refuses).

### Pitfalls
- gold-1 stays at **5**. The spec's "(with base 10 that is 10, 30, 50, 80, 110)" is an illustration for a hypothetical base; the rule "base = the branch's first node's stored price" gives run-start base 5, and AC#2 (each first node shows exactly what it did before) forces it. Do NOT edit `TECH_NODES` or "fix" gold-1 to 10.
- Depth is the node's array position (`findIndex + 1`), independent of `requires`: draft's `fourth-card` has `requires: null` yet sits at depth 3 → 50.
- Do NOT add `DRAFT_NODES` to `nodeInReach` — it was excluded before this task and must stay the same set; only the compared price changes.
- Remove every `full`/`strike` reference from TechScene (interface, both creation lines, both pushes, all four `setVisible` sites, the whole discount branch) but keep `RowNode.price` and `price: n.price` — `nodeCost` reads `.price` as the base.
- Owned nodes stay owned: the profile stores ids only; no migration. 3-digit prices (130) fit both viewports — card height comes from name+desc and the price row centers by `c.price.width`, so no geometry change.

### Tests
Step-3 tests cover AC#1 (`nodePrice` table incl. halves-up rounding to multiples of 5); the rewritten purchase tests cover AC#3 (pool 70/130, run-start 15/40/55, board 85, draft 30/50, deduction never below zero); the untouched `nodeInReach` test covers AC#4 (cheapest derived price is still gold-1 at 5). AC#2 holds by construction (`nodePrice(base,1) = base`, one number per row, no strike). Gate: `npm run check` and `npm run smoke` must pass.
