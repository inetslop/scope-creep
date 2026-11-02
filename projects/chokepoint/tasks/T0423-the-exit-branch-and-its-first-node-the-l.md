---
id: T0423
title: "The exit branch and its first node, The long watch: the leak warning starts 5 s out"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-02T12:03:44Z
epic: E20
---

## Goal
The tech tree gains a seventh branch, "The exit," for surviving the leak; its first node, The long watch (30 coins), starts the leak warning earlier — 5 s out instead of 3 s — so a between-run coin spend buys more time to see a leak coming.

## Details
- The tech screen gains a seventh branch row, "The exit," below the existing six (Run start, The board, The pool, The claim, The wave, The tower), in the same white-card row style and the same owned / locked / affordable states as every branch.
- The branch carries one node for now: "The long watch," 30 coins (the depth-1 price, the same 30 as every branch's first node), bought once with profile coins; while owned it is on for every run after and wears the owned mark on its card.
- The effect, on for the whole run while the node is owned: the leak warning — the pulsing red copy of the exit gate with its quiet tick per pulse — now starts when the enemy closest to the exit is within 5 s of reaching it, instead of 3 s. Same look, same tick, same trigger (the closest enemy's time-to-exit); only the threshold moves from 3 s to 5 s. Without the node the warning stays at 3 s, byte-identical to before.
- The node's card reads: name "The long watch," line "The leak warning starts 5 s out," price 30 coins — the branch's dry one-line style.
- The buy is recorded in the profile's owned list like every other node and survives a resume.

## Acceptance criteria
- [ ] The tech screen shows a seventh row "The exit" below "The tower," its card reading "The long watch" at a 30-coin price in the owned / locked / affordable states like the other nodes.
- [ ] Buying "The long watch" deducts 30 coins, marks the node owned on the profile, and the mark persists after a resume.
- [ ] In a run with the node owned, the red exit-gate warning pulse and its tick begin when the closest enemy is 5 s from the exit; the look and the per-pulse tick are unchanged, only the threshold moved.
- [ ] In a run without the node, the warning still starts at 3 s, byte-identical to before.
- [ ] The node is on for every run after it is bought and off for every run before it is bought; normal and Iron runs are otherwise unchanged.

## Design (architect, inet-racing)

### Files
- create `src/content/tech/exit.ts` — the "The exit" branch data: `ExitNode` interface + `EXIT_NODES` with the one node "The long watch" (id `long-watch`, price 30, effect field `lead: 5`).
- edit `src/core/tech.ts` — import `EXIT_NODES`; add `leakWarnLead(owned)` after `waveWalkFactor` (line 129); add `buyExitNode(store, id)` after `buyTowerNode` (end of file); add `EXIT_NODES` to the `nodeInReach` branch list (line 188).
- edit `src/systems/ExitWarning.ts` — take a `lead: number` constructor parameter (the last one) and use it in `inRange()` instead of the hardcoded `3`; update the 3 s doc comments.
- edit `src/scenes/GameScene.ts` — add `leakWarnLead` to the `core/tech` import (line 14) and pass it: `new ExitWarning(this, this.board, this.enemies, sfx, leakWarnLead(this.run.techOwned))` (line 141).
- edit `src/scenes/TechScene.ts` — import `EXIT_NODES` and `buyExitNode`; add `'exit'` to the `RowNode.branch` union (line 36); append `'The exit'` to `ROW_LABELS` (line 49); add the row after the `TOWER_NODES.map(...)` line (line 88); add the exit case to the `buy()` ternary chain; update the scene doc comment ("Seven branches" → "Eight", append `"The exit" (how long a leak is seen coming)`).
- edit `tests/core/tech.test.ts` — tests for `leakWarnLead` and `buyExitNode`.

### Interfaces
```ts
// src/content/tech/exit.ts
export interface ExitNode {
  id: string;
  name: string;
  line: string;
  price: number;
  /** seconds before the enemy reaches the exit that the leak warning starts */
  lead: number;
}
export const EXIT_NODES: readonly ExitNode[] = [
  { id: 'long-watch', name: 'The long watch', line: 'the leak warning starts 5 s out', price: 30, lead: 5 },
];

// src/core/tech.ts (after waveWalkFactor)
export function leakWarnLead(owned: readonly string[]): number; // 3, or the biggest owned exit node's lead (5); dedupe + unknown-id pattern like waveWalkFactor
export function buyExitNode(store: KeyValueStore | undefined, id: string): boolean; // exact clone of buyTowerNode with EXIT_NODES (no requires)

// src/systems/ExitWarning.ts
constructor(scene: Phaser.Scene, board: Board, enemies: EnemySystem, sfx: Sfx | undefined, lead: number); // stored as private readonly lead
// inRange(): `if (speed > 0 && e.remaining / speed <= this.lead) return true;`
```
TechScene row line (after the TOWER_NODES line): `EXIT_NODES.map((n) => ({ id: n.id, name: n.name, line: n.line, price: n.price, requires: null, unlocks: null, branch: 'exit' })),`

### Steps
1. Create `src/content/tech/exit.ts` (code above; file-header comment style like `content/tech/wave.ts`: `/** The "The exit" branch: nodes for surviving the leak. */`).
2. `core/tech.ts`: add the import next to the other `content/tech` imports (line 7); add `leakWarnLead` with the dedupe/`seen`-Set idiom, base `let lead = 3`, `if (node.lead > lead) lead = node.lead`; add `buyExitNode` cloned from `buyTowerNode` with `EXIT_NODES`; append `EXIT_NODES` to the array in `nodeInReach`.
3. `ExitWarning.ts`: add the `lead` field + last constructor parameter; replace `<= 3` with `<= this.lead`; reword the two doc-comment mentions of "3 s" to "its lead seconds".
4. `GameScene.ts`: the one import word and the one constructor argument.
5. `TechScene.ts`: the five edits listed in Files. In `buy()`, insert `node.branch === 'exit' ? buyExitNode(window.localStorage, node.id) :` just before the final `buyBoardNode` fallback. No layout math changes: the row is one card (odd-narrow rows already center alone via `lastOdd`), the panel grows by one row and the existing scale/scroll handles 412x915 and 1280x720; the 31-char line wraps at `WRAP_W` 132.
6. Tests (see below). Run `npm run check` and `npm run smoke`.

### Pitfalls
- Keep the unowned path byte-identical: `leakWarnLead` must return exactly `3` (the old constant) for any list without `long-watch`; don't move the 0.4 s pulse cadence or the `t` accumulator.
- `exitWarn.live` also drives the music's danger level (`audio/music.ts`); it now starts earlier while owned — that is intended (same trigger), change nothing there.
- `nodeCost` reads `branch[0].price`, so `ExitNode` must carry the `price` field; depth-1 price is the 30 base.
- `ROW_LABELS` order must stay in lockstep with the `rows` order (both append 'The exit' last).
- Buying persists via `profile.purchased` — no profile change needed; `loadProfile` dedupes and validates. Resumed runs read `run.techOwned` from the current profile at scene create, exactly like `waveWalkFactor`, so the node survives resume.
- Don't add an invariant (exitWarn.valid already covers the warning) and don't touch Sfx (leakWarn exists).

### Tests
In `tests/core/tech.test.ts`, modeled on the tower-row tests (lines 297–317): the exit row is one node, The long watch at 30 with `lead` 5; `leakWarnLead` is 3 with no/other-branch/unknown ids and 5 with `long-watch` owned (duplicates count once); a node buys only when known, unowned and affordable (no prerequisite); a purchase deducts exactly 30 and saves the id alongside the other branches.
