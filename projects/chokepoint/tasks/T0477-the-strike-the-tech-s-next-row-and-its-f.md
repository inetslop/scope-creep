---
id: T0477
title: "The strike: the tech's next row and its first node, The long arm"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-03T06:43:18Z
epic: E28
---

## Goal
The tech tree has covered run start, board, pool, claim, wave, tower management, exit, draft and kill — but not the tower's own strength: a tenth row, **The strike**, lets between-run coins buy the tower's raw power. Its first node, **The long arm** (30 coins), gives every tower +10% range, so a board that barely reached a choke now reaches it, in every run after.

## Details
- **Tech screen:** a new row "The strike" after The kill's row, with its first card, **The long arm**, shown at **30 coins** — the branch's base, the shown price from the row's own nodeCost as on every row (the branch base is never hardcoded). Same card shape as every branch: name, one muted one-liner, coin cost, buy, and the owned dot once bought. One-liner: "every tower's range +10%". Bought once with between-run coins, on for every run after, read from `run.techOwned` like the bounty (T0466). No buy-gate inside the branch: it buys independently at its depth price. No new HUD anywhere, and no change to any tower's look.
- **The effect:** with the node owned, every tower's range is ×1.1 — a new pure read in `core/tech.ts` (1.0 without the node, 1.1 with it) joined at the single place where a tower's spec composes its range (Tower.spec, `core/augments.ts`), the way the marked cell's damage multiplier rides its tower (T0340). It rides the composed range, not the base: a Reach's +35% grows a range that is then ×1.1, and a rally's reach (T0103) carries it too. The panel's range stat, the range ring (T0393), the placement ring and the targeting all read the tower's live range, so they all show the +10% with no change of their own.
- **Nothing else moves:** damage, attack speed, gold, slot costs, the marked cell's damage, the Haste aura, the surge and the Feast buff all behave exactly as today — the node only stretches the range.
- **Unowned is byte-identical:** without the node, every range, ring, reach and shot lands exactly as today, and the tech screen is otherwise unchanged.

## Acceptance criteria
- [ ] The tech screen shows a tenth row, "The strike", with one card: "The long arm" at 30 coins (the depth-1 price from nodeCost), buyable on its own, wearing the owned dot once bought; 29 coins refuses the buy.
- [ ] In a run with the node owned, a freshly built single-augment tower's panel range stat reads its composed range ×1.1, and the range ring and the placement ring match it; in a run without the node the same tower reads the bare composed range.
- [ ] The +10% rides growth on top of the base: a Reach-added tower and a rally's reach both carry it, and a shot still lands exactly where the ring says it reaches.
- [ ] Damage, attack speed, gold, slot costs, the marked cell's damage, the Haste aura, the surge and the Feast buff are untouched by the node.
- [ ] Without the node, every range and reach is byte-identical to today; unit tests cover the row shape, the 30 price, the ×1.1 read (with dedupe and unknown ids, like the bounty's tests) and the buy refusal, and npm run check is green.

## Design (architect, desktop)

### Files
- create `src/content/tech/strike.ts` - the "The strike" branch data: `StrikeNode` interface + `STRIKE_NODES` (one node, The long arm)
- edit `src/core/tech.ts` - import `STRIKE_NODES`; add `strikeRangeMul()` after `milestoneMul()` (line ~201); add `buyStrikeNode()` after `buyKillNode()` (end of file); append `STRIKE_NODES` to the `nodeInReach` branch list (line 260)
- edit `src/core/augments.ts` - `towerSpec` gains an optional second parameter; the composed range is stretched at the end
- edit `src/entities/Tower.ts` - new `rangeMul` field next to `cellMul`; `refresh()` passes it to `towerSpec`
- edit `src/systems/TowerSystem.ts` - `build()` sets `tower.rangeMul` from the run's owned nodes
- edit `src/systems/RunSave.ts` - resumed towers get `rangeMul` too
- edit `src/systems/Building.ts` - both hover `towerSpec(...)` calls pass the factor
- edit `src/scenes/TechScene.ts` - tenth row: label, branch union, row line, buy chain
- edit `tests/core/tech.test.ts` - row shape, price, ×1.1 read, buy refusal; keep the two `nodeInReach` tests green
- edit `tests/core/augments.test.ts` - the ×1.1 rides the composed range

### Interfaces
```ts
// content/tech/strike.ts
export interface StrikeNode { id: string; name: string; line: string; price: number; rangeMul: number; }
export const STRIKE_NODES: readonly StrikeNode[];

// core/tech.ts
export function strikeRangeMul(owned: readonly string[]): number; // 1.0 without the node, 1.1 with it
export function buyStrikeNode(store: KeyValueStore | undefined, id: string): boolean;

// core/augments.ts
export function towerSpec(augments: readonly AugmentCopy[], rangeMul = 1): TowerSpec;
```

### Steps
1. Create `src/content/tech/strike.ts` (model on `tower.ts`):
```ts
/** The "The strike" branch: nodes for how far a tower's reach goes. */
export interface StrikeNode {
  id: string;
  name: string;
  line: string;
  price: number;
  /** the multiplier every tower's composed range takes while the node is owned (The long arm: 1.1) */
  rangeMul: number;
}

/** One node for now, The long arm: every tower's range ×1.1. */
export const STRIKE_NODES: readonly StrikeNode[] = [
  { id: 'long-arm', name: 'The long arm', line: "every tower's range +10%", price: 30, rangeMul: 1.1 },
];
```
2. `src/core/tech.ts`: import `STRIKE_NODES` after the `KILL_NODES` import. Add after `milestoneMul()` (copy its dedupe/unknown-id shape; biggest `rangeMul`, 1 when none):
```ts
/** The multiplier every tower's composed range takes for the owned strike nodes: the biggest owned node's rangeMul, 1 when none has one; each node counts once, unknown ids count for nothing. */
export function strikeRangeMul(owned: readonly string[]): number {
  let mul = 1;
  const seen = new Set<string>();
  for (const id of owned) {
    if (seen.has(id)) continue;
    seen.add(id);
    const node = STRIKE_NODES.find((n) => n.id === id);
    if (!node) continue;
    if (node.rangeMul > mul) mul = node.rangeMul;
  }
  return mul;
}
```
Add `buyStrikeNode` at the end (byte-copy of `buyKillNode` with `STRIKE_NODES`, doc comment like the tower/exit ones: no prerequisites and no gate, effect in every run the moment it is bought). In `nodeInReach`, append `STRIKE_NODES` to the `for (const branch of [...])` list, after `KILL_NODES`.
3. `src/core/augments.ts`: change line 138 to `export function towerSpec(augments: readonly AugmentCopy[], rangeMul = 1): TowerSpec {`. After the pulse block (line 282, `if (spec.kind === 'pulse') {...}`), before the crit line, add:
```ts
  // The strike node stretches the finished range (core/tech.ts): Reach's growth is in, so it rides on top.
  if (rangeMul !== 1) spec.range *= rangeMul;
```
4. `src/entities/Tower.ts`: after the `cellMul = 1;` field (line 55) add `/** The strike node's range factor (1.1 while owned, core/tech.ts); set by systems/TowerSystem.ts and systems/RunSave.ts. */\n  rangeMul = 1;`. In `refresh()` (line 138): `const spec = towerSpec(this.augments, this.rangeMul);`.
5. `src/systems/TowerSystem.ts`: in `build()`, after the `tower.cellMul = ...` line (68): `tower.rangeMul = strikeRangeMul(this.run.techOwned); // the strike node stretches every tower's range (core/tech.ts)`. Import `strikeRangeMul` from `'../core/tech'`.
6. `src/systems/RunSave.ts`: after the `tower.cellMul = ...` line (98): `tower.rangeMul = strikeRangeMul(run.techOwned); // the strike node's reach is in every run, resumed too`. Import from `'../core/tech'`.
7. `src/systems/Building.ts`: import `strikeRangeMul` from `'../core/tech'`; line 135 → `this.board.showHover(cell, ok, ok ? towerSpec(augments, strikeRangeMul(this.run.techOwned)).range * CELL : 0);`; line 196 → `this.board.showHover(cell, true, towerSpec([held], strikeRangeMul(this.run.techOwned)).range * CELL);`.
8. `src/scenes/TechScene.ts`: (a) `ROW_LABELS` (line 51): append `'The strike'` after `'The kill'`; (b) `RowNode.branch` union (line 38): add `'strike'`; (c) `rows` (line 92): append after the KILL_NODES line: `STRIKE_NODES.map((n) => ({ id: n.id, name: n.name, line: n.line, price: n.price, requires: null, unlocks: null, branch: 'strike' })),`; (d) `buy()` chain (lines 324–339): insert `: node.branch === 'strike' ? buyStrikeNode(window.localStorage, node.id)` before the final `buyBoardNode` fallback; (e) imports: `STRIKE_NODES` from `'../content/tech/strike'`, `buyStrikeNode` added to the `core/tech` import list; (f) header comment line 23: "Nine branches" → "Ten branches", add `and "The strike" (every tower's reach goes further)` to the row list.
9. `tests/core/tech.test.ts`: import `STRIKE_NODES` and add `buyStrikeNode, strikeRangeMul` to the core/tech import. Add (model on the kill row's tests, lines 367–424): row shape — `expect(STRIKE_NODES.map((n) => [n.id, n.name, n.line, n.price, n.rangeMul])).toEqual([['long-arm', 'The long arm', "every tower's range +10%", 30, 1.1]]);`; `nodeCost(STRIKE_NODES, 'long-arm')).toBe(30)` (add to the existing nodeCost test); `strikeRangeMul` — `([])` 1, `(['gold-1', 'nope'])` 1, `(['long-arm'])` 1.1, `(['long-arm', 'long-arm', 'bounty'])` 1.1; `buyStrikeNode` — `withCoins(29)` refuses (coins stay 29), `withCoins(30)` buys (coins 0, purchased ends `['long-arm']`), unknown id and re-buy refuse. In BOTH `nodeInReach` tests (lines 462 and 463) spread `...STRIKE_NODES` into the owned arrays, or the now-unowned 'long-arm' (30 coins) makes them fail.
10. `tests/core/augments.test.ts`: add one test (reuse the file's existing copy-building style): with `bolt = { id: 'bolt', tier: 'common' }` — `towerSpec([bolt], 1.1).range` is `toBeCloseTo(towerSpec([bolt]).range * 1.1)`, and for `grown = [bolt, { id: 'reach', tier: 'common' }]` the same identity holds (the ×1.1 rides Reach's ×1.35).

### Pitfalls
- Apply the factor only after all composition (after the pulse `spec.range += spec.splash` fold) and guard with `if (rangeMul !== 1)` — unowned runs must stay byte-identical, and the `EMPTY` early return must not see the parameter.
- `Tower.rangeMul` must be set before the first `refresh()` — both `TowerSystem.build()` and `RunSave.ts` set it on the line after `cellMul`, before `addAugment()` triggers `refresh()`. Moved towers keep it (run-level, cell-independent): do not touch `moveTo()`.
- Everything downstream (panel stat `statsLine`, `RangeRing`, `BeamSystem`, `HasteSystem`, `RallySystem`, `flyLine`, `TowerSystem.rangeOf`, targeting) already reads `t.spec.range` — do not touch them; the barrel length in `towerLook.ts` clamps itself, that is not a look change.
- `nodeInReach` now includes the strike branch: at 30 coins the menu Tech dot lights for it — expected. The two existing `nodeInReach` tests list every branch; forgetting `...STRIKE_NODES` there breaks the suite, not just the new tests.
- No new HUD, hotkey, invariant or sound; the card reuses the existing card shape and single-card row layout (same as The tower's row), so the 412x915 / 1280x720 layouts are unchanged.

### Tests
- `tests/core/tech.test.ts`: row shape + line + 30 price; `nodeCost(STRIKE_NODES, 'long-arm')` = 30; `strikeRangeMul` with none/unknown/other-branch ids, owned, and dedupe; `buyStrikeNode` refusal at 29, success at 30 (coins deducted), unknown id, re-buy; `nodeInReach` owned-array updates.
- `tests/core/augments.test.ts`: ×1.1 rides the composed range (bare first, and Reach-grown), default parameter leaves existing spec byte-identical.
