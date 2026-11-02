---
id: T0433
title: "The first pass: the run's first leak costs no life"
size: M
priority: 2
status: todo
depends_on: [T0429]
attempts: 0
created: 2026-11-02T16:14:55Z
epic: E20
---

## Goal
The exit branch's third node: one free leak per run, bought once with between-run coins — the first time the road breaks through is a warning, not a cost.

## Details
- The tech screen's exit branch (T0423's row) gains a third node, "The first pass": 155 coins by the depth rule (the branch's own price curve, depth 3), bought independently like the branch's other nodes (no buy gate inside the branch, the T0370 rule), the branch's own card and owned-mark pattern.
- With the node owned, the run's first leak — whatever the leaker — costs no life: the enemy leaves through the exit, the leak's own feedback plays (the thud, the jolt, the echo, the combo break, a standing Toll's gold and the Hauler's +5 gold still pay), and the lives number does not move. The second and later leaks pay in full (a Block's halved cost from T0429 applies from the second leak on, with the node owned). A boss leak that ends the run still ends it — the pass waives the life cost only.
- A wave that leaks through the free pass is not clean (a leak happened): it wears no held chip (it cost 0 lives, nothing to show) and breaks the clean streak as any leak does (T0045's rule); the run's story mark is the held gray, not the clean green.
- Teach: with the node owned, the run's first-leak chip (T0107's own moment, look and spot at the exit) reads "first leak free · after that, leaks cost a life" instead of T0107's line — once per run, the once-flag riding the same per-run state as the pass. Without the node, T0107's chip is byte-identical.
- The pass is per run: a per-run flag (spent or not) the run save carries (the T042 run-save pattern), so a resumed run keeps whether the pass was spent; the node itself is the usual permanent profile purchase.

## Acceptance criteria
- [ ] The exit branch lists three nodes; the third reads "The first pass" at the depth-3 price, buys independently and wears the owned mark like the branch's others.
- [ ] With it owned, the run's first leak costs no life and shows the one-time free-pass chip at the exit; the second leak pays in full (a Block pays 1 life with T0429 owned, 2 without).
- [ ] The Hauler's +5 gold and a standing Toll's gold still pay on the free pass; a boss leak that ends the run still ends it.
- [ ] A free-pass wave is not clean: no held chip, the clean streak breaks, the story mark is the held gray.
- [ ] A resumed run keeps the pass state: one that spent it before closing pays its next leak in full with no chip; one that did not keeps the pass.
- [ ] Without the node, every leak is byte-identical to today, including T0107's chip.

## Design (architect, cachyos-x8664)

The run's exit is already there; what isn't bought is *surviving it*. This task adds **"The exit" branch** to the tech tree (`TechScene`, row 8): two nodes, each changing what a leak costs or how early it is seen, so every run after — the run the coins are spent in — carries both.

- **The long watch** (30 coins): the leak warning starts 5 s out, not 3.
- **One life a Block** (30 coins, depth-2 price 85): a Block that leaks costs 1 life instead of 2.

No prerequisites, no gate: a node's effect is in every new run the moment it is bought.

### Files

- `src/content/tech/exit.ts` (new): the branch. `ExitNode` type (`{ id, name, line, price, lead, blockCost }`) and `EXIT_NODES`: `long-watch` (The long watch, "the leak warning starts 5 s out", price 30, lead 5, blockCost 2) and `one-life-block` (One life a Block, "a Block that leaks costs 1 life instead of 2", price 30, lead 3, blockCost 1).
- `src/core/tech.ts` (shared, the three lines): `leakWarnLead(owned)` — 3, or the biggest owned node's `lead`; `blockLeakCost(owned)` — 2, or the smallest owned node's `blockCost`; both count each id once and ignore unknown ids (the `seen` Set, like `leakWarnLead`'s siblings). `buyExitNode(store, id)` exactly like `buyTowerNode` (refuses unknown/owned/unaffordable, coins never below zero, try/catch save). `nodeInReach`: `EXIT_NODES` into the branch list.
- `src/scenes/TechScene.ts` (shared, the four lines): import `EXIT_NODES`/`buyExitNode`; `'exit'` in `RowNode`'s `branch` union; "The exit" in `ROW_LABELS`; the `EXIT_NODES.map` row (`requires: null, unlocks: null, branch: 'exit'`); buy dispatch: `node.branch === 'exit' ? buyExitNode(window.localStorage, node.id)`.
- `src/systems/EnemySystem.ts` (the two lines): a `blockLeakCost` field set in the constructor from `blockLeakCost(run.techOwned)`; the leak cost picks it for `def.id === 'block'`, else `e.def.livesCost`.
- `src/systems/enemyHooks/blockTeach.ts` (new, one file): the hook that teaches the cost — on the first Block leak, before any chip (the leak has paid), it shows the taught chip at the exit anchor (average of the path's last two points) with the run's `blockLeakCost(run.techOwned)`.
- `src/systems/fx/blockTold.ts` (new, one file): the chip — "the Block takes 1 life" / "the Block takes 2 lives", same look and life as the first-leak chip (`fx/full` early-out, `fx.track`, `PALETTE` only).
- `src/core/run.ts` (one line): `blockTold: boolean` on the run — the Block's double-leak teach showed; a Block that leaked has paid, a resumed run never re-teaches.
- `src/core/saveRun.ts` + `src/systems/RunSave.ts` (one line each): the field, with the older-save guard (absent → `false`).
- `src/systems/ExitWarning.ts` (one line): the constructor takes `lead` seconds (default 3), replacing the hard-coded `remaining / speed <= 3`.
- `src/scenes/GameScene.ts` (one line): construct `ExitWarning` with `leakWarnLead(this.run.techOwned)`.
- `src/debug/runChecks.ts` (one line): the invariant — `blockLeakCost(run.techOwned) >= 1` and `leakWarnLead(run.techOwned) > 0`.
- `tests/core/tech.test.ts`: the exit tests.

### Interfaces

- `EXIT_NODES: readonly ExitNode[]` — content only; `lead` (seconds the leak warning starts before the exit, the warning's lead) and `blockCost` (the lives a leaking Block costs on every run after; The long watch: 2, unchanged; One life a Block: 1).
- `leakWarnLead(owned: readonly string[]): number` — pure; the run's warning lead; no Phaser.
- `blockLeakCost(owned: readonly string[]): number` — pure; the run's Block leak cost; no Phaser.
- `buyExitNode(store: KeyValueStore | undefined, id: string): boolean` — buys from the saved profile's coins; the id into `profile.purchased`; the price out of `profile.coins`.
- `MakeEnemyHook` in `blockTeach.ts` — `onLeak(enemy)`: no state in module-level variables; a new run makes a new hook.
- `blockTold(fx, x, y, cost)` — the chip; `fx.track` for the life; `fx.full` early-out.

### Steps

1. `content/tech/exit.ts`: the type and the two nodes, one file, data only.
2. `core/tech.ts`: `leakWarnLead` (biggest owned lead, 3 when none) and `blockLeakCost` (smallest owned `blockCost`, 2 when none), each counting every id once and skipping unknown ids; `buyExitNode` on the `buyTowerNode` model (the `nodeCost(EXIT_NODES, id)` price, the `profile.purchased` push, the try/catch save); `EXIT_NODES` into `nodeInReach`'s list.
3. `TechScene.ts`: the eighth row, the branch union, the label, the row's data, the buy dispatch.
4. `EnemySystem`: the `blockLeakCost` field from the run's tech; the leak cost picks it for the Block, else `livesCost`.
5. `blockTeach.ts`: the hook — the first Block leak, before any chip (`run.blockTold` set before the chip, so a resumed run never re-teaches), at the exit anchor, with the run's owned cost; the run's `START.lives` decides whether it waits for the first-leak chip (the chip's life, then the line, so the lines read one after the other) or fires at once.
6. `fx/blockTold.ts`: the chip — the life the taught leak costs, "the Block takes 1 life" or 2, the same look and life as the first-leak chip.
7. `run.ts` the `blockTold` field; `saveRun.ts`/`RunSave.ts` the field (the older save predates it: absent → `false`).
8. `ExitWarning`: the `lead` constructor parameter (the run's `leakWarnLead`, 3 when none owned); `GameScene` passes it at construction (the run's tech is fixed then).
9. `runChecks.ts`: the invariant.
10. `tests/core/tech.test.ts`: the exit tests.

### Pitfalls

- The two resolvers take **owned ids, not the run**: `EnemySystem` and `blockTeach` read `run.techOwned`; `GameScene` reads it at construction — the run's tech doesn't change mid-run, so a resumed run carries the same.
- The teach chip and the leak cost must agree: both from `blockLeakCost(run.techOwned)` — never a hard-coded 2 (the Block's `livesCost` is 2, the taught number is the owned one).
- The price: 30 at its depth (85 for the second node, `nodePrice(30, 2)`); the buy deducts the depth price, not the base.
- `blockTold` is run state, set **before** the chip (the leak has paid; the chip may not fire at `fx.full`); persisted (a resumed run re-teaches nothing).
- Counting each id once, unknown ids for nothing — the same contract as every other branch's resolver.
- Don't grow `EnemySystem` (the field and the pick) or `FxSystem` (the chip is its own file, `fx.track`'d); `PALETTE` only (the chip is `card`/`muted`, no new color); board units for the anchor (the last two path points, same as `LeakCost` and `ExitWarning`).
- One line each in the shared files (`tech.ts`, `TechScene.ts`, `run.ts`, `saveRun.ts`, `RunSave.ts`); the chip's life and look match the first-leak chip's.

### Tests

- `EXIT_NODES` exact: `[['long-watch', 'The long watch', 'the leak warning starts 5 s out', 30, 5, 2], ['one-life-block', 'One life a Block', 'a Block that leaks costs 1 life instead of 2', 30, 3, 1]]`.
- `leakWarnLead`: `[]` → 3; other-branch/unknown ids → 3; `['long-watch']` → 5; duplicates count once.
- `blockLeakCost`: `[]` → 2; other-branch/unknown → 2; `['one-life-block']` → 1; duplicates count once.
- `buyExitNode`: unknown id refuses; already owned refuses (coins stay); unaffordable refuses and coins stay (29 < 30); a buy deducts exactly 30, saves the id, coins never below zero.
- The depth-2 node buys at 85; 84 refuses.
- `nodeCost(EXIT_NODES, 'one-life-block')` → 85; `nodeInReach` counts the exit's unowned nodes (the exit's last node, at its depth).
