---
id: T0429
title: "One life a Block: the exit branch's second node, a leaking Block costs 1 life"
assignee: inet-racing
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-02T15:49:41Z
claimed_at: 2026-11-02T16:23:35Z
epic: E20
---

## Goal
The tech tree's "The exit" branch grows its second node: spend 85 coins once and, on every run after, a Block that leaks costs 1 life instead of 2 — a between-run buy that softens the run's single heaviest leak.

## Details
- The "The exit" branch (the row added by T0423) gains a second node, "One life a Block", priced 85 coins by the branch's depth rule — the depth-2 price on the same curve the thin road (T0369) and Held pays (T0348) use. Bought once, on for every run after, and bought independently of the branch's other nodes (no gate inside the branch).
- While owned, a leaking Block costs 1 life instead of 2. The Block's own data stays `livesCost: 2`; the leak applies the reduced cost only when the node is owned, read through one pure function in the tech read path (the long-watch node's own pattern, T0423), so a run without the node is byte-identical for every enemy.
- The tech card's description reads "a Block that leaks costs 1 life instead of 2".
- The run's first Block leak in a node-owned run wears the existing first-Block-leak chip's look (T0349) reading the live cost: "the Block takes 1 life" when the node is owned, "the Block takes 2 lives" otherwise — the softened cost is taught at the moment it is paid, not left unexplained (Pillar 8).
- The new node and its read live in the tech content and the tech read path (the exit content file and core/tech.ts) plus the single leak call site; the Block's data, every other enemy, and the branch's existing node (The long watch) are untouched.

## Acceptance criteria
- [ ] The tech tree's "The exit" branch shows a second node "One life a Block" at 85 coins; it buys once, persists in the profile, and its card description reads the 1-life rule.
- [ ] In a run with the node owned, a Block that leaks costs 1 life; in a run without it, a Block that leaks still costs 2 lives (non-owned runs are byte-identical to before).
- [ ] The run's first Block leak in a node-owned run shows the exit chip reading "the Block takes 1 life"; in a non-owned run it reads "the Block takes 2 lives".
- [ ] The branch's existing node (The long watch) and its pricing are unchanged; only the new node is added to the row.

## Design (architect, inet-racing)

### Files
- edit `src/content/tech/exit.ts` - add `blockCost: number` to `ExitNode`, add the second node `one-life-block`, update the header comment
- edit `src/core/tech.ts` - add pure read `blockLeakCost(owned)` next to `leakWarnLead` (after line 144)
- edit `src/systems/EnemySystem.ts` - import `blockLeakCost`, store it once from `run.techOwned`, apply it in the single `leak()` call site (lines 291-295)
- edit `src/systems/fx/blockTold.ts` - take a `cost: number` param; label reads the live cost
- edit `src/systems/enemyHooks/blockTeach.ts` - read the live cost via `blockLeakCost(run.techOwned)` and pass it to `blockTold`
- edit `tests/core/tech.test.ts` - the exit-row test now expects two nodes; add `blockLeakCost` and depth-2 price tests

### Interfaces
```ts
// content/tech/exit.ts — field added to ExitNode; long-watch gets 2
/** the lives a leaking Block costs on every run after (The long watch: 2, unchanged; One life a Block: 1) */
blockCost: number;

export const EXIT_NODES: readonly ExitNode[] = [
  { id: 'long-watch', name: 'The long watch', line: 'the leak warning starts 5 s out', price: 30, lead: 5, blockCost: 2 },
  { id: 'one-life-block', name: 'One life a Block', line: 'a Block that leaks costs 1 life instead of 2', price: 30, lead: 3, blockCost: 1 },
];
// price: 30 is the branch base in every entry; the scene and buyExitNode price it with nodeCost(EXIT_NODES, id) = nodePrice(30, 2) = 85.
// Header comment becomes: "Two nodes: The long watch (the leak warning starts 5 s out); One life a Block (a leaking Block costs 1 life)."

// core/tech.ts — after leakWarnLead, same dedup shape as leakWarnLead
/** The lives a leaking Block costs in a new run: 2, or the smallest owned node's blockCost (One life a Block: 1); each node counts once, unknown ids count for nothing. */
export function blockLeakCost(owned: readonly string[]): number {
  let cost = 2;
  const seen = new Set<string>();
  for (const id of owned) {
    if (seen.has(id)) continue;
    seen.add(id);
    const node = EXIT_NODES.find((n) => n.id === id);
    if (!node) continue;
    if (node.blockCost < cost) cost = node.blockCost;
  }
  return cost;
}

// systems/fx/blockTold.ts — only the first two lines change
export function blockTold(fx: FxSystem, x: number, y: number, cost: number): void {
  ...
  const label = fx.scene.add.text(0, -1, cost === 1 ? 'the Block takes 1 life' : 'the Block takes 2 lives', { ...same... });
```

### Steps
1. `content/tech/exit.ts`: add the field and the node line (exact text above). Nothing else in this file changes.
2. `core/tech.ts`: add `blockLeakCost` immediately after `leakWarnLead` (line 144), copy the `seen`-dedup body of `leakWarnLead` with `let cost = 2` and `if (node.blockCost < cost) cost = node.blockCost`.
3. `systems/EnemySystem.ts`: add `blockLeakCost` to the imports (with the other `core/` imports, ~line 10); add field `private readonly blockLeakCost: number;` next to `private readonly sfx` and in the constructor after `this.sfx = sfx;` set `this.blockLeakCost = blockLeakCost(run.techOwned); // the exit node softens the Block's leak (core/tech): 2 without it`. In `leak()` (line 291) add `const cost = e.def.id === 'block' ? this.blockLeakCost : e.def.livesCost;` as the first line, and use `cost` in `this.run.leak(cost)` and in the popText `` `-${cost}` `` — the `-${...}` text must show 1, not 2, when owned.
4. `systems/fx/blockTold.ts`: add the `cost: number` param and swap the hardcoded label for the ternary (same font, palette, chip).
5. `systems/enemyHooks/blockTeach.ts`: import `blockLeakCost` from `../../core/tech`; in `onLeak` compute `const cost = blockLeakCost(run.techOwned);` after the early return and pass it in both `blockTold(fx, x, y, cost)` calls (the delayed one and the immediate one).
6. `tests/core/tech.test.ts`: add `blockLeakCost` to the import list (line 9); rewrite the exit-row test (line 321) to expect both nodes `[n.id, n.name, n.line, n.price, n.lead, n.blockCost]` = `[['long-watch', 'The long watch', 'the leak warning starts 5 s out', 30, 5, 2], ['one-life-block', 'One life a Block', 'a Block that leaks costs 1 life instead of 2', 30, 3, 1]]`; add `expect(nodeCost(EXIT_NODES, 'one-life-block')).toBe(85);` to the `nodeCost` test (line 362); add a `blockLeakCost` test mirroring the `leakWarnLead` one (line 327): 2 for `[]`, `['gold-1', 'long-watch', 'nope']`; 1 for `['one-life-block']` and `['gold-1', 'one-life-block', 'one-life-block']`; add an exit depth-2 buy test: `expect(buyExitNode(withCoins(84), 'one-life-block')).toBe(false)` and a store `withCoins(100)` → `buyExitNode(store, 'one-life-block')` true, `loadProfile(store).coins` 15.
No other files change: TechScene renders whatever `EXIT_NODES` holds (price via `nodeCost`, buy via `buyExitNode`), the exit row already lays out two cards (the wave row has two; narrow mode is two per grid row, so the panel's size does not change), the Block's data stays `livesCost: 2`, and long-watch is untouched.

### Pitfalls
- Don't hardcode 85 anywhere: the price is always `nodeCost(EXIT_NODES, 'one-life-block')` (depth 2 on the base-30 curve = 85). The `price: 30` field is only the branch base, matching every other node entry.
- Non-owned runs must be byte-identical: when the node is absent, `blockLeakCost` returns 2, which equals `def.livesCost`, so `run.leak`, the popText and everything else read the same values as before. The `e.def.id === 'block'` guard keeps every other enemy on `def.livesCost`.
- Keep the popText in `EnemySystem.leak()` on the softened `cost` (it will read `-1` in owned runs) — it is part of the "reads the live cost" acceptance.
- `blockTold` is called from a `time.delayedCall`; the `cost` is read synchronously in `onLeak` and closed over — a resumed run re-enters with the same profile, so this is stable.
- Chip timing is unchanged: the delay-vs-`START.lives` logic in blockTeach stays as-is; only the label text and its param change.
- No new scene, HUD part, input or invariant — TechScene and the chip are both data-driven already.

### Tests
- `tests/core/tech.test.ts` (as in step 6): the two-node exit row shape, `nodeCost(EXIT_NODES, 'one-life-block')` = 85, `blockLeakCost` defaults/dedup/ownership, and the 85-coin depth-2 purchase with the unaffordable 84 rejection.
