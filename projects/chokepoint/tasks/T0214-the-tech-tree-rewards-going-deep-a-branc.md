---
id: T0214
title: "The tech tree rewards going deep: a branch discount"
assignee: cachyos-x8664
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-29T15:52:06Z
claimed_at: 2026-10-29T17:26:21Z
epic: E2
---

## Goal
A player who completes a branch pays less for its later nodes, so going deep in one branch is worth it over spreading thin across branches.

## Details
- In the tech tree, a node's price drops as more of its own branch is already owned: the first node of a branch is full price, the second costs 5 coins less, and the third and any later node cost 10 coins less. The discount never takes a node below 5 coins. The discount is derived purely from how many nodes of that branch are owned — there is nothing extra to buy, and it resets to nothing the moment a branch has no owned nodes.
- The node card shows it exactly where the price already sits: the full price in muted gray with a thin strike line through it, and the discounted price in the normal ink right beside it. A first node (no discount) shows only its normal price — no strike line.
- Buying pays the discounted price and owns the node exactly as it does today; the owned mark is unchanged.
- The rule applies to every branch automatically (run start, the draft, the pool, the board, the claim) — no per-branch content change.
- Bright minimal: the strike line is a thin muted-gray stroke over the old price, no color, no theme dressing.

## Acceptance criteria
- [ ] The first node bought in a branch pays its full listed price, and its card shows only that price (no strike line).
- [ ] Once exactly one node of a branch is owned, the next unowned node's card shows the full price struck through and a price 5 coins lower; buying it pays the lower price.
- [ ] Once two or more nodes of a branch are owned, the next node's card shows the full price struck through and a price 10 coins lower (never below 5); buying it pays that.
- [ ] The discount is per branch: owning any number of nodes in one branch never changes the price of a node in a different branch.
- [ ] An owned node keeps its owned mark and shows no price at all (no strike line).
- [ ] No other screen changes: the menu, the profile card, the pause card and the claim card are untouched; the discount appears only on tech-tree node cards.

## Design (architect, cachyos-x8664)

### Files
- edit `src/core/tech.ts` — add `ownedInBranch` + `branchPrice`; price the three buys with them.
- edit `src/scenes/TechScene.ts` — `TechCard` gains `full` (struck price) + `strike` (Graphics); build in `rebuild()`, price/draw in `refresh()`.
- edit `tests/core/tech.test.ts` — add discount tests; fix the two expectations the discount breaks.

### Interfaces
```ts
// src/core/tech.ts
export function ownedInBranch(nodes: readonly { id: string }[], purchased: readonly string[]): number;
export function branchPrice(price: number, ownedCount: number): number;
```

### Steps

1. `src/core/tech.ts` — add the two pure helpers, then make every buy deduct the discounted price (the discount is per-branch, so each branch's own list is what gets counted):
```ts
/** How many of a branch's nodes are already owned: the branch discount prices a node off this count. */
export function ownedInBranch(nodes: readonly { id: string }[], purchased: readonly string[]): number {
  return nodes.reduce((n, node) => n + (purchased.includes(node.id) ? 1 : 0), 0);
}
/** The price a branch node costs now: full price, 5 less with one owned, 10 less with two or more, never below 5. */
export function branchPrice(price: number, ownedCount: number): number {
  const discount = ownedCount >= 2 ? 10 : ownedCount === 1 ? 5 : 0;
  return Math.max(price - discount, 5);
}
```
In `buyNode`, `buyPoolNode`, `buyClaimNode`, replace the `profile.coins < node.price` check and the `profile.coins -= node.price` line with the discounted price, counting that branch's own list:
```ts
const price = branchPrice(node.price, ownedInBranch(TECH_NODES, profile.purchased)); // POOL_NODES / CLAIM_NODES in the other two
if (profile.coins < price) return false;
profile.coins -= price;
```

2. `src/scenes/TechScene.ts` — import `branchPrice, ownedInBranch` from `../core/tech`. Add to the `TechCard` interface `full: Phaser.GameObjects.Text` and `strike: Phaser.GameObjects.Graphics`. In `rebuild()`, next to the `price` text:
```ts
const full = this.add.text(0, 34, '', textStyle(13, PALETTE.muted, { fontStyle: 'bold' })).setOrigin(0, 0.5);
const strike = this.add.graphics();
button.content.add([name, effect, price, full, strike, nodeCoin]);
// and push: this.cards.push({ node, button, price, full, strike, coin: nodeCoin, border });
```
In `refresh()`, compute the discounted price from the branch's own owned count (the row holding this node is its branch):
```ts
const row = this.rows.find((r) => r.some((n) => n.id === c.node.id))!;
const ownedCount = ownedInBranch(row, this.profile.purchased);
const now = branchPrice(c.node.price, ownedCount);
const afford = this.profile.coins >= now;
```
In the for-sale branch (the `else` after owned/locked/not-content), replace the single-price layout: when `ownedCount === 0` keep the current single-price layout and hide `full`/`strike`; otherwise set `full` to `String(c.node.price)` in `PALETTE.muted`, set `price` to `String(now)` in `afford ? PALETTE.ink : PALETTE.red`, show all three, and lay the row out centered in the 160-wide button — coin left at `-w/2 + 6`, `full.x = -w/2 + 20`, `price.x = -w/2 + 20 + full.width + 8`, where `w = 20 + full.width + 8 + price.width` — then draw the strike:
```ts
c.strike.clear();
c.strike.lineStyle(1, PALETTE.muted, 1);
c.strike.lineBetween(c.full.x, 34, c.full.x + c.full.width, 34);
```
In the owned/needs-the-previous/not-in-content branches, also `c.full.setVisible(false)` and `c.strike.setVisible(false)` so a card never shows a stale strike. `c.button.setEnabled(afford && unlocked && inContent && !owned)` now uses the discounted `afford`. The owned mark, border, hover lift, the Menu/Pause/Rewards/StatsCard coin displays and `nodeInReach` all stay as they are.

3. `tests/core/tech.test.ts` — import `branchPrice, ownedInBranch`; add:
```ts
describe('the branch discount', () => {
  it('full price with none owned, 5 less with one, 10 less with two or more, never below 5', () => {
    expect(branchPrice(30, 0)).toBe(30); expect(branchPrice(30, 1)).toBe(25);
    expect(branchPrice(30, 2)).toBe(20); expect(branchPrice(30, 3)).toBe(20);
    expect(branchPrice(5, 1)).toBe(5); expect(branchPrice(10, 2)).toBe(5);
  });
  it('ownedInBranch counts only the given branch, unknown and other-branch ids count for nothing', () => {
    expect(ownedInBranch(TECH_NODES, [])).toBe(0);
    expect(ownedInBranch(TECH_NODES, ['gold-1', 'haste', 'nope'])).toBe(1);
    expect(ownedInBranch(TECH_NODES, ['haste', 'clean2'])).toBe(0);
  });
  it('a later node buys cheaper, deducted from the coins', () => {
    const s = withCoins(100, ['gold-1']); expect(buyNode(s, 'gold-2')).toBe(true);
    expect(loadProfile(s).coins).toBe(95); // gold-2 at 5
    const s2 = withCoins(25, ['gold-1', 'gold-2', 'gold-3']); expect(buyNode(s2, 'life-1')).toBe(true);
    expect(loadProfile(s2).coins).toBe(5); // life-1 at 20
  });
});
```
And fix the two existing expectations the discount breaks: in `the full chain of four, bought in order, leaves the remainder`, `toBe(10)` → `toBe(35)` (the four now cost 5+5+5+20); in `a pool purchase deducts exactly the price...`, the `momentum` line `toBe(25)` → `toBe(30)` (momentum is now 25 with haste already owned, so 55−25).

### Pitfalls
- The discount is per-branch, so each `buy*` counts its own list (`TECH_NODES`/`POOL_NODES`/`CLAIM_NODES`), never the whole `purchased` array — otherwise a start-branch node would get cheaper just because a pool node is owned.
- Two existing tests fail until you fix the two numbers above; the full chain now costs 35 total, and the second pool node is 25 not 30.
- The `strike` Graphics must be added to `button.content` (so it lifts with the price) and cleared each `refresh()`, else a stale line lingers; hide it in the owned/locked/not-content states.
- The no-discount layout (a first node) must hide `full`/`strike` and use only the plain price — no strike line.

### Tests
`tests/core/tech.test.ts` (branchPrice table, ownedInBranch per-branch count, discounted deduction, plus the two corrected expectations).

### DEPENDS_ON
The branch discount is generic — it prices whatever branches exist, so it needs none of the draft/board nodes other tasks add.
