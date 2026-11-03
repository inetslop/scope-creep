---
id: T0466
title: "The kill: the tech's next row and its first node, The bounty"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-03T02:48:20Z
epic: E25
---

## Goal
The tech tree has covered run start, board, pool, claim, wave, tower, exit and the draft — but not the kill itself: a "The kill" row on the tech screen lets between-run coins buy how a kill pays, starting with its first node, The bounty, which makes every kill pay +1 more gold.

## Details
- The branch: the tech screen's next row, "The kill", placed after The exit's row in the exit branch's row pattern (T0423, the closest example): one node for now, bought once and on for every run after, the owned mark on the bought node, the branch discount rule (T0214) already applying to its later nodes.
- The bounty (30 coins, the branch's first node; the card reads "The bounty — every kill pays +1 gold"): every kill pays +1 gold. The +1 rides on the bounty before the multipliers, so the quiet wave's ×2 (T0071) and the last stand's ×2 (T0054) double it too: a Dot (4 gold) pays 5, 10 on a quiet wave, 20 in the last stand on a quiet wave. The gold pop reads the summed number in the last stand's own look (T0054); no new HUD.
- What the node does not touch: the Mint's +1 aura (still paid whole on top), the combo gold (T0066's +2/+4 pop), the Hauler's leak cost, the wave's clear bonus, and the run's coin tally.
- Parked behind this row (tasked once it lands): The window (85 coins, the kill-chain window +0.5 s) and The milestone (155 coins, the chain's milestone pay ×2).

## Acceptance criteria
- [ ] The tech screen shows the new row "The kill" with one node, "The bounty · 30", in the branch row's own look; it buys for 30 coins, wears the owned mark, and the buy is remembered on the profile.
- [ ] With The bounty bought, kills in the next run pay +1 gold each: a Dot's kill pops 5 (4 without the node), a Hauler's 11; the number in the pop is the gold actually paid.
- [ ] The +1 is doubled by the quiet ×2 and the last stand ×2 (a Dot pops 10 on a quiet wave, 20 in the last stand on a quiet wave).
- [ ] Without the node, every kill pays exactly what it paid before — no run-state change for an unbought profile.
- [ ] The coin tally, the claim card and the Hauler's leak cost are unchanged by the node.

## Design (architect, desktop)

### Files
- create `src/content/tech/kill.ts` — the "The kill" branch data: `KillNode` interface and `KILL_NODES` (one node, The bounty), modeled on `src/content/tech/exit.ts`
- edit `src/core/tech.ts` — import `KILL_NODES`; add `killBounty()` after `blockLeakCost()`; add `buyKillNode()` after `buyExitNode()`; add `KILL_NODES` to `nodeInReach`'s branch array
- edit `src/systems/EnemySystem.ts` — extend the `'../core/tech'` import and one line in `kill()` so the bounty rides the base gold before the doublings
- edit `src/scenes/TechScene.ts` — imports, the branch doc comment, the `RowNode.branch` union, the `rows` list, `ROW_LABELS`, and the buy dispatch
- edit `tests/core/tech.test.ts` — the row/purchase/readout tests, the `nodeCost` line, and the two `nodeInReach` expectations

### Interfaces
```ts
// src/content/tech/kill.ts (whole file; mirrors exit.ts)
/** The "The kill" branch: nodes for how a kill pays. */
export interface KillNode {
  id: string;
  name: string;
  line: string;
  price: number;
  /** gold every kill pays extra, added to the bounty before the quiet and last-stand doublings (The bounty: 1) */
  bounty: number;
}

/** One node for now: The bounty (every kill pays +1 gold). */
export const KILL_NODES: readonly KillNode[] = [
  { id: 'bounty', name: 'The bounty', line: 'every kill pays +1 gold', price: 30, bounty: 1 },
];

// src/core/tech.ts
/** The extra gold every kill pays for the owned kill nodes: the sum of the owned nodes' bounty, 0 when none; each node counts once, unknown ids count for nothing. */
export function killBounty(owned: readonly string[]): number; // same loop shape as blockLeakCost, summing node.bounty
export function buyKillNode(store: KeyValueStore | undefined, id: string): boolean; // copy of buyExitNode with KILL_NODES
```

### Steps
1. Create `src/content/tech/kill.ts` exactly as above.
2. `src/core/tech.ts`: after `import { EXIT_NODES } ...` add `import { KILL_NODES } from '../content/tech/kill';`. After `blockLeakCost()` add `killBounty()` (the standard seen-set loop over `KILL_NODES`, `bounty += node.bounty`). In `nodeInReach` make the branch array `[TECH_NODES, POOL_NODES, CLAIM_NODES, BOARD_NODES, WAVE_NODES, TOWER_NODES, EXIT_NODES, KILL_NODES]`. At the end, after `buyExitNode`, add `buyKillNode` — a verbatim copy of `buyExitNode` with `EXIT_NODES` → `KILL_NODES` and the doc comment saying a kill node has no prerequisites and no gate.
3. `src/systems/EnemySystem.ts`: line 12 becomes `import { blockLeakCost, killBounty } from '../core/tech';`. In `kill()`, line 279 becomes `const baseGold = killGold(this.run, (leanBounty(e.def.gold, this.run.level) + killBounty(this.run.techOwned)) * quietGoldMul(this.run.wave));` and the comment above it gains the clause: "…thinned by Lean (core/levels.ts), gains the bounty node's gold (core/tech.ts), then doubles on a quiet wave (core/waves.ts);". Do not touch the mint addition, the pop or the hooks — `paid` already carries the bounty, so the existing `+${paid}` pop and the last stand's look read it for free.
4. `src/scenes/TechScene.ts`: after the EXIT_NODES import add `import { KILL_NODES } from '../content/tech/kill';`; in the core/tech import add `buyKillNode` (keep alphabetical position after `buyExitNode`'s siblings as they are). Doc comment line 22: "Eight branches" → "Nine branches"; line 27: `back) and "The exit" (how long a leak is seen coming).` → `back), "The exit" (how long a leak is seen coming) and "The kill" (how a kill pays).`. `RowNode.branch` union: append `| 'kill'` after `'exit'`. `ROW_LABELS`: append `'The kill'` after `'The exit'`. `rows`: after the EXIT_NODES row add `KILL_NODES.map((n) => ({ id: n.id, name: n.name, line: n.line, price: n.price, requires: null, unlocks: null, branch: 'kill' })),`. In `buy()`, in the dispatch chain insert before the final `: buyBoardNode(...)`: `: node.branch === 'kill'\n ? buyKillNode(window.localStorage, node.id)`.
5. `tests/core/tech.test.ts`: import `KILL_NODES` (content) and add `buyKillNode, killBounty` to the core/tech import. After the exit block add: a row-shape test expecting `[['bounty', 'The bounty', 'every kill pays +1 gold', 30, 1]]`; a `killBounty` test (0 with `[]`, other-branch and unknown ids; 1 with `['bounty']`; 1 with duplicates); a buy test (unknown id, 29 coins refuses, already-owned refuses, 60 coins buys and leaves 30 with the id saved alongside `['gold-1', 'long-watch']`). In the `nodeCost` test add `expect(nodeCost(KILL_NODES, 'bounty')).toBe(30); // the kill branch's first node, at depth one`. In both `nodeInReach` tests append `...KILL_NODES` to the owned-id spreads so only the existing cases stay unowned.

### Pitfalls
- Order of operations in `kill()`: the `+ killBounty(...)` must sit inside the parentheses before `* quietGoldMul` and inside `killGold(...)`, or the doublings won't apply (the acceptance numbers 5/10/20 fall out exactly from that placement).
- `mint = paid - baseGold` stays correct because the mint bonus is still the only thing added above `baseGold`; don't move it.
- The two `nodeInReach` tests fail if `KILL_NODES` joins the branch loop without the test spreads growing — update them in the same commit.
- No RunState field, no save-format change: the effect reads `run.techOwned` live, so resumed runs get it for free (same as `blockLeakCost`/`waveWalkFactor`).
- Layout needs nothing: Pass B computes every y from the rows, the lone narrow card centers itself (`lastOdd`), and the panel already scrolls when it overflows 412x915. The 30-coin price, the owned mark and the done dot all come from the existing row machinery.

### Tests
- The five `tests/core/tech.test.ts` additions above (row shape, `killBounty` readout, buy/afford/deduct, the `nodeCost` line) and the two `nodeInReach` updates.
