---
id: T0386
title: "The rich cell: the tower branch's second node, the marked cell 1.25× to 1.5×"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-01T22:53:02Z
epic: E16
---

## Goal
The tech tree's "The tower" branch (T0383) gains its second node — The rich cell: 85 coins, the board's marked cell makes its tower carry a 1.5× buff instead of 1.25×, in every run after the purchase. The branch's value node, built ahead of The light move (the branch's third node, 155 coins, once the move exists).

## Details
- **The card.** A second node on the "The tower" branch — The rich cell, 85 coins by the depth rule (the branch's depth-2 price, derived exactly like the thin road's 85, T0369), shown derived like every other node's price (the struck-through old price included). Bought once, on for every run after. No buy-gate inside the branch: each node buys independently at its depth price (the Soft-sell pattern, T0383) — it can be bought whether or not Soft sell is owned. Card line: "the marked cell makes its tower 1.5× stronger, not 1.25×." It sits directly after Soft sell; the branch's third slot is left for The light move.
- **The effect.** While owned, the board's marked cell (T0340) carries a 1.5× buff instead of its 1.25× — the cell's own buff value, read from the owned tech at the site where the 1.25× is already applied (a `markedCellMul(owned)` reader in the sellRefund pattern, T0383), so wherever the marked cell's buff is already shown it reads 1.5× when owned. A run without the node is byte-identical to today (1.25×).
- **Why it matters in play.** The marked cell's position, look and which boards carry it are unchanged; only its buff rises, so a tower placed on the cell is worth 33% more than before — the one guaranteed strong cell on the board becomes a stronger call, and the board's placement decision (Pillar 1) sharpens around it.
- **The dot.** The menu's Tech button dot counts the new node: it shows while the profile's coins can buy at least one unowned node, The rich cell included (the Soft-sell dot's own behavior, T0383).
- **On screen / layout.** Nothing new stays on screen: the tech screen shows the node owned, and the marked cell's buff reads 1.5× where it is already shown — nothing shown twice, nothing painted on the board. The "The tower" row now holds two cards and still fits at 412x915 and 1280x720 (the wave branch's three-card row is the existing example of the row's wrapping layout).

## Acceptance criteria
- [ ] The tech screen's "The tower" branch shows a second node, The rich cell: 85 coins by the depth rule, card line "the marked cell makes its tower 1.5× stronger, not 1.25×", bought with the branch's existing dispatch, shown owned, not buyable again, and buyable whether or not Soft sell is owned.
- [ ] With the node owned, the marked cell's buff is 1.5× (its buff site reads 1.5 from the owned tech, shown wherever the buff is already shown); a run without the node is exactly 1.25× and byte-identical to before this task.
- [ ] The menu's Tech dot shows while the coins can buy The rich cell or any other unowned node, and clears when nothing is affordable.
- [ ] The marked cell's position, look and which boards carry it are untouched; no other branch's nodes or prices, augment, enemy, wave or board rule changes.
- [ ] The tech card fits at 412x915 and 1280x720 with the tower row holding two cards (the layout check in the gate).
- [ ] The game is playable menu to game over with the node owned and unbought, on desktop and mobile.

## Design (architect, desktop)

### Files
- edit `src/content/tech/tower.ts` - add the `cellMul` field to `TowerNode` and the second node `rich-cell` after `soft-sell`; update the two comments that say the branch has one node / only sells
- edit `src/core/techEffects.ts` - add the `markedCellMul(owned)` reader next to `sellRefund`, importing `MARKED_DMG_MUL` from `./markedCell`
- edit `src/systems/TowerSystem.ts` - `build()` (line 68) reads the buff through the reader; swap the imports
- edit `src/systems/RunSave.ts` - resume (line 96) reads the buff through the reader; swap the imports
- edit `src/debug/runChecks.ts` - the `towers.markedCell` invariant (line 114) expects the reader's value; swap the imports
- edit `src/scenes/PickScene.ts` - the two existing "one cell · +25% damage" texts read the owned buff (landscape card line 220, portrait detail line 306)
- edit `tests/core/tech.test.ts` - tower-row data test gains the second node; `nodeCost` depth-2 assertion; a buy test for the node
- edit `tests/core/techEffects.test.ts` - `markedCellMul` tests next to the `sellRefund` test

### Interfaces
```ts
// src/content/tech/tower.ts — added to the existing interface, after `refund: number;`
  /** the board's marked cell's damage multiplier, when the node raises it (1.25 when none does) */
  cellMul?: number;

// src/core/techEffects.ts — new export, placed directly after sellRefund()
export function markedCellMul(owned: readonly string[]): number;
```
TechScene needs no change: its `rows` map over `TOWER_NODES`, `nodeCost()` pricing, `buyTowerNode()` dispatch, owned border and `nodeInReach()` dot all pick the node up from the data. `nodeCost(TOWER_NODES, 'rich-cell')` is `nodePrice(30, 2)` = 85.

### Steps
1. `src/content/tech/tower.ts`: add the field above, then this line after the `soft-sell` line: `{ id: 'rich-cell', name: 'The rich cell', line: 'the marked cell makes its tower 1.5× stronger, not 1.25×', price: 85, refund: 0, cellMul: 1.5 },` — no `requires` field exists or is added (no in-branch gate). Rewrite the two comments (lines 1 and 11) to name both nodes.
2. `src/core/techEffects.ts`: add `import { MARKED_DMG_MUL } from './markedCell';` after the `TOWER_NODES` import. Add:
```ts
/** The board's marked cell's damage multiplier: the biggest owned tower node's `cellMul`, MARKED_DMG_MUL (1.25) when none raises it; each node counts once, unknown ids count for nothing. */
export function markedCellMul(owned: readonly string[]): number {
  let mul = MARKED_DMG_MUL;
  const seen = new Set<string>();
  for (const id of owned) {
    if (seen.has(id)) continue;
    seen.add(id);
    const node = TOWER_NODES.find((n) => n.id === id);
    if (!node) continue;
    if (node.cellMul !== undefined && node.cellMul > mul) mul = node.cellMul;
  }
  return mul;
}
```
3. `src/systems/TowerSystem.ts`: change line 9 to `import { markedCellMul, sellPrice, slotPrice } from '../core/techEffects';` and delete line 11 (`MARKED_DMG_MUL` import — its only use is line 68). Line 68 becomes: `tower.cellMul = this.board.onMarked(cell) ? markedCellMul(this.run.techOwned) : 1; // the board's marked cell: +25%, 1.5× with The rich cell`
4. `src/systems/RunSave.ts`: add `import { markedCellMul } from '../core/techEffects';` and delete line 6 (the `MARKED_DMG_MUL` import, only used at line 96). Line 96 becomes: `tower.cellMul = game.board.onMarked(cell) ? markedCellMul(run.techOwned) : 1; // the board's marked cell: +25%, 1.5× with The rich cell` (`run` is already in scope there; a resumed run keeps the profile's current nodes, like `farGate`).
5. `src/debug/runChecks.ts`: add `import { markedCellMul } from '../core/techEffects';` and delete line 8. Line 114 becomes: `const want = g.board.onMarked(t.cell) ? markedCellMul(g.run.techOwned) : 1;`
6. `src/scenes/PickScene.ts`: add `import { markedCellMul } from '../core/techEffects';`. In the landscape build method (where line 220 is) and in `buildDetail` (where line 306 is), compute once near the texts: `const pct = Math.round((markedCellMul(loadProfile(window.localStorage).purchased) - 1) * 100);` and replace each `'one cell · +25% damage'` with the template `one cell · +${pct}% damage` (keep each text's existing style options). `loadProfile` is already imported.
7. Tests (exact cases): in `techEffects.test.ts`, after the `sellRefund` test: `markedCellMul([])` = 1.25, `(['rich-cell'])` = 1.5, `(['soft-sell'])` = 1.25, `(['gold-1'])` = 1.25, `(['soft-sell', 'rich-cell', 'rich-cell', 'nope'])` = 1.5 (add the name to the file's import). In `tech.test.ts`: the tower-row test maps `[n.id, n.name, n.line, n.price, n.refund, n.cellMul]` to `[['soft-sell', 'Soft sell', "a sell pays 80% of its slots' cost, not 70%", 30, 8, undefined], ['rich-cell', 'The rich cell', 'the marked cell makes its tower 1.5× stronger, not 1.25×', 85, 0, 1.5]]`; add `expect(nodeCost(TOWER_NODES, 'rich-cell')).toBe(85); // the tower branch's depth 2` to the `nodeCost` test; add a buy test: 84 coins refuses, 100 coins with Soft sell unowned buys at 85 (coins 15, `purchased` `['rich-cell']`), buying again refuses.
8. Run `npm run check` then `npm run smoke`.

### Pitfalls
- Unused import: `MARKED_DMG_MUL` must leave `TowerSystem.ts`, `RunSave.ts` and `runChecks.ts` (lint fails on it); keep it in `core/markedCell.ts` untouched (value, `markedCell()` and the painted dot stay 1.25-era code — position and look are out of scope).
- Byte-identical when unbought: the reader's default is `MARKED_DMG_MUL`, and `Math.round((1.25 - 1) * 100)` is 25, so every readout renders the same string as today.
- No gate: do not invent a `requires` on the node or a check in `buyTowerNode`; Soft-sell-less purchase is an acceptance criterion.
- Do not add a third node (The light move's slot stays empty) and do not touch other branches' rows, prices, the tech screen layout code, or `towerDps`/`BeamSystem` (they already read `tower.cellMul`).
- PickScene text: `+50%` is the same width as `+25%`; both sites keep their current style and wrap options, so nothing reflows at 412x915 or 1280x720. The tower row's two cards sit at x ±86 in the 356-wide narrow panel (12 px margin each side) — no layout code change.

### Tests
- `tests/core/techEffects.test.ts`: `markedCellMul` default 1.25, 1.5 with the node, Soft sell and other-branch/duplicate ids count for nothing.
- `tests/core/tech.test.ts`: both tower rows' data including `cellMul`, `nodeCost` 85 at depth 2, buy at 85 without Soft sell, refuse at 84, refuse when already owned.
