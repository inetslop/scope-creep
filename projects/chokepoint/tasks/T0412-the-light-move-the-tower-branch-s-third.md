---
id: T0412
title: "The light move: the tower branch's third node, a move's fee 30% instead of 60%"
size: M
priority: 2
status: todo
depends_on: [T0386]
attempts: 0
created: 2026-11-02T08:58:13Z
epic: E16
---

## Goal
The tower branch gets its third node: for 155 coins between runs, moving a misplaced tower costs 30% of its slots' gold instead of 60% (the floor and the 5-gold minimum stay), so repositioning against the wave preview keeps being a real decision and stops being a tax for players who do it.

## Details
- A third node on the tech screen's "The tower" branch, under Soft sell and The rich cell: "The light move," 155 coins by the depth rule (the branch's 30 base at depth 3), bought once, on for every run after. Its card line: "a move costs 30% of its slots, not 60%."
- While owned, every move's fee is 30% of the tower's slots' cost, floored, minimum 5 — the move's own rule at the new rate (60% when not owned). The panel's "Move · −N" line reads the live fee, so it shows the smaller number while owned, and the ✓ pays exactly what the line says; the −N chip, the slide, the drop-in bounce and the blip are the move's own, unchanged.
- No new screen element, key or sound; a normal or Iron run that never moves is byte-identical, and the fee reads the node's owned state at run start (a run started after the buy uses 30% throughout).

## Acceptance criteria
- [ ] The tech screen's "The tower" branch shows a third node, "The light move," at 155 coins; buying it spends the coins and marks it owned like the branch's other nodes.
- [ ] With the node owned, the Move line and the fee paid read 30% of the tower's slots' cost, floored, minimum 5 (a tower whose slots cost 100 moves for 30, not 60; a small tower still floors at 5); without it, the fee is the current 60% rule, unchanged.
- [ ] A move while owned pays the smaller fee with the move's own feedback (chip, slide, bounce, blip) unchanged, and a resumed run uses the fee of the node's current owned state.
- [ ] Unit tests cover the fee owned vs not-owned for a small tower (the 5 floor) and a large one, and the branch's depth price reads 155; the fee tests sit with the move-fee's tests, where T0394's fee tests live.

## Design (architect, inet-racing)

### Files
- edit `src/content/tech/tower.ts` - add an optional `moveRate` field to `TowerNode`; append the third node `light-move` to `TOWER_NODES` after T0386's rich-cell entry
- edit `src/core/techEffects.ts` - `moveRefund` returns the owned node's `moveRate` when set; update the doc comments of `moveRefund`/`movePrice`
- edit `tests/core/techEffects.test.ts` - move-fee tests: light-move owned vs not (small tower at the slot's 5 floor, large tower, with Soft sell)
- edit `tests/core/tech.test.ts` - extend the tower-row shape test with the light-move entry; add `nodeCost(TOWER_NODES, 'light-move')` = 155 and a 155-coin buy

### Interfaces
```ts
// src/content/tech/tower.ts — add to TowerNode (mirror the exact field set T0386 leaves rich-cell with;
// if `refund` is still required there, give light-move `refund: 7` — neutral for sells; if T0386 made it optional, omit it):
  /** the move's fee per 10 of a tower's slots' cost while owned: The light move pays 3 (30%), replacing the sell-derived rate */
  moveRate?: number;

// append as the third entry of TOWER_NODES:
  { id: 'light-move', name: 'The light move', line: 'a move costs 30% of its slots, not 60%', price: 155, /* refund per above */ moveRate: 3 },

// src/core/techEffects.ts — new moveRefund body (signature unchanged: (owned: readonly string[]) => number):
  let refund = 6;
  let moveRate: number | undefined;
  const seen = new Set<string>();
  for (const id of owned) {
    if (seen.has(id)) continue;
    seen.add(id);
    const node = TOWER_NODES.find((n) => n.id === id);
    if (!node) continue;
    if (node.refund !== undefined && node.refund > refund) refund = node.refund;
    if (node.moveRate !== undefined) moveRate = node.moveRate;
  }
  return moveRate ?? refund;
```
`movePrice` stays byte-for-byte (`Math.max(5, Math.floor((paid * moveRefund(owned)) / 10))`) — the floor and 5 minimum stay. Nothing else changes: `TowerPanel.ts:181` and `Building.ts:279` already read `movePrice(..., run.techOwned)` live, and `GameScene.ts:101-102` re-reads `loadProfile().purchased` for both new and resumed runs, so the run-start/resume and "line shows what the ✓ pays" criteria hold with no code.

### Steps
1. Read `src/content/tech/tower.ts` and `tests/core/tech.test.ts` as they stand — T0386 has already added the rich-cell entry there. Add the `moveRate?: number` field to `TowerNode` next to the other fields.
2. Append the light-move entry as the third (last) entry of `TOWER_NODES`, matching rich-cell's field set plus `moveRate: 3`, `price: 155`.
3. Rewrite `moveRefund` in `src/core/techEffects.ts` with the body above (keep `sellRefund`, `sellPrice`, `movePrice` bodies untouched); fix the two doc comments to say 30% with The light move.
4. Add the fee tests in `tests/core/techEffects.test.ts` next to the existing move-fee tests (import `nodeCost`, `TOWER_NODES`, `buyTowerNode` only where used):
```ts
it('with The light move, moving pays 30% of what the unlocked slots cost, floored at 5, Soft sell included', () => {
  expect(movePrice(1, 0, ['light-move'])).toBe(12);            // 30% of the 40 first slot (not owned: 24)
  expect(movePrice(2, 65, ['light-move'])).toBe(13);           // 30% of 40 + 5, the second slot at its 5 floor (not owned: 27)
  expect(movePrice(MAX_SLOTS, 0, ['light-move'])).toBe(201);   // 30% of 40 + 70 + 160 + 400 (not owned: 402)
  expect(movePrice(2, 65, ['soft-sell', 'light-move'])).toBe(13); // the node's rate replaces the sell-derived one
});
it('moveRefund is 3 per 10 with The light move (even over Soft sell), 6/8 otherwise', () => {
  expect(moveRefund(['light-move'])).toBe(3);
  expect(moveRefund(['soft-sell', 'light-move'])).toBe(3);
  expect(moveRefund(['soft-sell', 'light-move', 'light-move', 'nope'])).toBe(3);
});
```
5. In `tests/core/tech.test.ts`: extend the tower-row shape test (~line 298) with `['light-move', 'The light move', 'a move costs 30% of its slots, not 60%', 155, /* refund value matching step 1 or undefined */]` in the same tuple shape that test maps; add `expect(nodeCost(TOWER_NODES, 'light-move')).toBe(155);` beside the existing `nodeCost(TOWER_NODES, 'soft-sell')` check (~line 338); extend the tower-purchase test: `buyTowerNode(withCoins(154), 'light-move')` false, then a store with 155 coins buys it leaving 0 and `purchased` `['light-move']`.
6. Run `npm run check`.

### Pitfalls
- The price is computed, not stored: `nodeCost` reads `TOWER_NODES[0].price` (30) and the node's index — light-move must sit at index 2 (after rich-cell), or it costs 85 instead of 155. That is why this task depends on T0386.
- Do not touch `sellRefund`/`sellPrice`/`TowerSystem.sell` — the node changes moves only; sells keep 70/80%.
- Do not edit `TowerPanel.ts`, `Building.ts`, `TowerSystem.ts` or `GameScene.ts` — the fee already reads `run.techOwned` live everywhere it is shown or charged.
- The owned fee must override Soft sell's 80% (`moveRate ?? refund`), not max with it — the spec says every move's fee is 30% while owned.
- Card layout needs nothing: TechScene measures each card from its text (`m.h`) and the tower row already wraps 3 cards (like The draft's row) at 412×915 and 1280×720.

### Tests
- Fee: owned vs not for a small tower (second slot at the 5 floor: 13 vs 27), a full tower (201 vs 402), and with Soft sell owned (13, override); `moveRefund` 3/6/8 cases.
- Branch: `nodeCost(TOWER_NODES, 'light-move')` 155, row shape includes the third node, buy at 155 deducts and saves the id, 154 refuses.
