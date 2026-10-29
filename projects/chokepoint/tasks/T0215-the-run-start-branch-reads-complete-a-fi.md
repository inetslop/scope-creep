---
id: T0215
title: "The run-start branch reads complete: a fifth node and a done mark"
assignee: asus
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-29T15:52:06Z
claimed_at: 2026-10-29T16:20:55Z
epic: E2
---

## Goal
The run-start branch has a last node to reach, and a branch that is fully owned is visibly done.

## Details
- Add a fifth node to the run-start branch: a second “Life +1” at 40 coins. It uses the same life effect the branch's existing life node already uses, so the two life nodes stack — buying both starts a run with two more lives than a run with neither.
- A branch that has every one of its nodes owned wears a small complete mark: one small filled yellow dot (the tree's own accent) at the right edge of the branch title line. A branch with any unowned node shows no mark. The dot appears the moment the last node is bought and, because nodes cannot be un-bought, never clears.
- The new node's card looks exactly like the branch's other nodes: the name “Life +1”, its price, and the owned mark once bought. If the branch discount (T0214) has landed, this node shows the discounted price like its siblings; if it has not, the node shows 40. This task does not depend on T0214 — it lands correctly either way.
- The done mark works for any branch: the claim branch, which has a single node, wears the dot the moment that node is owned.

## Acceptance criteria
- [ ] The run-start branch now has five nodes; the fifth is a second “Life +1” priced at 40 coins.
- [ ] Buying both life nodes starts a new run with exactly two more lives than a run with neither (the effects stack).
- [ ] The moment the last unowned node of the run-start branch is bought, one small yellow dot appears at the right edge of that branch's title; the dot is absent from any branch that still has an unowned node.
- [ ] A single-node branch that is fully owned (the claim branch, once its one node is bought) also wears the dot.
- [ ] Buying the fifth node deducts 40 coins (or the discounted price, if T0214 has landed) from the profile and owns the node exactly like the branch's other nodes.
- [ ] No other branch, node or screen changes; the done dot is the only new readout.

## Design (architect, desktop)

### Files
- edit `src/core/tech.ts` - add the fifth node `life-2` to `TECH_NODES`; fix its doc comment
- edit `src/scenes/TechScene.ts` - one done-dot per branch title line; wide panel width follows the longest row
- edit `tests/core/tech.test.ts` - update the two run-start chain tests, add the stacking test

### Interfaces
No new types or functions. The new node in `TECH_NODES` (exact line, placed after `life-1`):
```ts
{ id: 'life-2', name: 'Life +1', line: 'new runs start with one more life', price: 40, requires: 'life-1', gold: 0, life: 1 },
```
Stacking, buying, and the menu dot all come free: `startBonuses` sums `node.life` over owned ids, `buyNode`/`nodeInReach` are generic. Change the `TECH_NODES` doc comment to: `The "Run start" branch: one row of five, each node needing the one before it. The two life nodes sit last and stack.`

### Steps
1. `src/core/tech.ts`: add the `life-2` line above to `TECH_NODES` (after `life-1`) and update its comment as above. Touch nothing else in this file.
2. `src/scenes/TechScene.ts` — field, next to `private cards: TechCard[] = [];`:
   ```ts
   private rowDots: Phaser.GameObjects.Circle[] = [];
   ```
3. In `rebuild()`: after `this.cards = [];` add `this.rowDots = [];`.
4. In `rebuild()`, replace `this.panelW = wide ? 716 : 356;` with:
   ```ts
   // The widest row decides the panel's width: 172 between cards, 160 card, 20 at each side.
   const maxRow = Math.max(...this.rows.map((r) => r.length));
   this.panelW = wide ? Math.max(716, (maxRow - 1) * 172 + 200) : 356;
   ```
5. In `rebuild()`, the row loop currently starts with `parts.push(this.add.text(...ROW_LABELS[r]...));`. Replace those two lines with:
   ```ts
   const label = this.add.text(0, -this.panelH / 2 + geoms[r].label, ROW_LABELS[r], textStyle(14, PALETTE.muted)).setOrigin(0.5);
   // The done mark: the tree's accent dot at the right edge of the title line, only while every node is owned.
   const dot = this.add.circle(label.width / 2 + 9, -this.panelH / 2 + geoms[r].label, 3, PALETTE.yellow).setVisible(false);
   this.rowDots.push(dot);
   parts.push(label, dot);
   ```
   Leave the `row.forEach(...)` card block exactly as it is — the fifth card renders like its siblings with no further change.
6. In `refresh()`, after the `for (const c of this.cards)` loop, add:
   ```ts
   this.rows.forEach((row, r) => {
     this.rowDots[r].setVisible(row.every((n) => this.profile.purchased.includes(n.id)));
   });
   ```
7. `tests/core/tech.test.ts`:
   - Test `'the run-start row is one chain of four: ...'` → rename to `'the run-start row is one chain of five: three gold nodes, then two lives'` and append `['life-2', 40, 'life-1', 0, 1],` to the expected array.
   - In `'a node buys only when it is known, unowned, unlocked and affordable'` add one line: `expect(buyNode(withCoins(60), 'life-2')).toBe(false); // the previous life node is not owned`
   - Add after `'every owned node adds its bonus, ...'`:
     ```ts
     it('the two life nodes stack: owning both adds two lives', () => {
       expect(startBonuses(['life-1', 'life-2'])).toEqual({ gold: 0, life: 2 });
       expect(startBonuses(['gold-1', 'gold-2', 'gold-3', 'life-1', 'life-2'])).toEqual({ gold: 15, life: 2 });
     });
     ```
   - Test `'the full chain of four, bought in order, leaves the remainder'` → rename to `'...chain of five...'`, use `withCoins(110)`, expect `coins` `10` and `purchased` `['gold-1', 'gold-2', 'gold-3', 'life-1', 'life-2']`.

### Pitfalls
- Do not modify `startBonuses`, `buyNode`, `buyPoolNode`, `buyClaimNode` or `nodeInReach` — they already handle the new node; the stacking acceptance criterion needs zero logic change.
- Do not invent discount or special-price code for `life-2`: it reads `node.price` through the existing price path, so if T0214 lands later its discounted price applies to this node automatically.
- The dots must go into `parts` (they become children of the box container) — that is what `rebuild()` destroys via `this.box?.destroy()`; resetting `this.rowDots` in `rebuild()` keeps indices aligned with `this.rows`.
- The dot is a scene-level `Phaser.GameObjects.Circle` added with the same y as its label; do not add it to a card's `button.content`.
- The existing narrow layout already wraps the fifth card into a third grid row centered (the `lastOdd` formula), and the panel grows ~2 px past a 412x915 fit — the pre-existing scroll/arrow path absorbs it. Do not change grid pitches, `ROW_LABELS`, or add branches.
- Never hardcode 888 for `panelW`; the `Math.max(716, ...)` formula keeps today's layout when no row has more than four cards.

### Tests
- `tests/core/tech.test.ts` updates above (chain of five, life-2 lock, life stacking, full-chain purchase at 110 coins).
- `npm run check` and `npm run smoke` must pass (smoke covers the Tech screen at 412x915 and 1280x720).
