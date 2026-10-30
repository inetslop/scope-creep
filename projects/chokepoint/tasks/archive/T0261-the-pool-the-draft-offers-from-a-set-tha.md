---
id: T0261
title: "The pool: the draft offers from a set that grows at each clear"
size: M
priority: 2
status: failed
depends_on: [T0260]
attempts: 0
created: 2026-10-30T05:49:22Z
epic: E3
---

## Goal
The build grows across levels: the run's draft offers from a small pool of augments, and clearing a level is a moment to add one more to it — E3's progression.

## Details
- A run starts with a draft pool of six augments: Bolt, Rapid, Splash, Lance, Reach and Push (minus any the 16-cap has already removed; Bolt never leaves the index, so the first-draft floor (T0048) always holds). Every draft offer rolls from the pool with today's tier odds — the three cards, the 4th card of the second pick (T0065) and the reroll (T0036) — and every other draft rule (no repeat (T0052), the odds shift (T0011), the fit row (T0243), the what-if price (T0251)) is unchanged, only the source is the pool.
- Clearing a level (wave 10 or 20, after T0260's top card) opens the level pick, its own moment: a full-screen overlay over the new board, on the draft scene's pattern — a title with the level the run enters ("Level 2") and a muted "one for your pool" under it, and three cards offered from the augments that are in the index, not yet in the pool, and not in the codex's locked set (T0248 — Haste, Momentum, Mend as their registrations land), rolled with the draft's own odds at that depth. No reroll, no pass: tapping a card picks it — the card lifts with the hand's ring, the tier chime (T0032), a muted "Lance · added to your pool" line under the row — ~400 ms later the scene closes and the normal draft opens, which can already offer the just-added augment (the pool is seven by then).
- The picked augment joins the pool for the rest of the run: level 2 drafts from seven, level 3 from eight. The pool is part of the run's save: a resumed run keeps its pool and the pick never re-opens; a ghost run is a normal run on the saved seed's boards (it follows the pool rules like any run and never changes the saved seed).
- The tech pool nodes (Haste's (T0153) and Momentum's (T0209)) add their augment to the run's pool when bought — before the run or mid-run — the same unlock the draft's source now is; a tech-locked augment never appears in a pick's offers. The codex (T0221) and its locks (T0248) stay a global reference of everything that exists, unchanged.
- The offer set is always at least three (the index is 15-16, the pool 6-7, the locked set at most 3); if it ever is not, offer whatever is left. The menu demo is byte-identical (it runs one wave, not a run).
- New files: a core/pool.ts with unit tests (the initial set, the offers, the pick, the tech add, the save shape) and the pick scene on the draft scene's pattern.
- The screen bar, stated: the pick is a moment, not a mark — it adds no card or chip to the board or HUD and no input beyond tapping a card; the pool itself is new information (what the build is made of from now on), shown only where the player touches it: the offers and the added-to-pool line.

## Acceptance criteria
- [ ] A fresh run's drafts offer only pool members; the pre-wave-1 draft still always includes a Common Bolt.
- [ ] Clearing wave 10 opens the pick over the new board: exactly three cards, all outside the pool, none locked, with tier odds as the draft's at that depth.
- [ ] Tapping a card shows the chime and the "added to your pool" line, then the normal draft opens, which can offer the added augment.
- [ ] The pick opens exactly once after wave 10 and once after wave 20; a resumed run mid-level 2 keeps its seven-augment pool and the pick never re-opens.
- [ ] Buying the Haste or Momentum node mid-run makes that augment offerable from the next draft, and it never appears in a pick's offers.
- [ ] The second pick's 4th card and the reroll roll from the pool; the codex and its locks are unchanged.
- [ ] The scene fits both 412x915 and 1280x720 (three cards, one row each), and the smoke test passes on desktop and mobile.

## Design (architect, cachyos-x8664)

### Files
- `core/run.ts` — `RunState.pool: string[]` (the per-run pool of augment ids) and `RunState.buyPoolNode(nodeId: string, cost: number): boolean` (the mid-run pool-node purchase).
- `content/profile.ts` — a run-gold `POOL_NODE_COST` (the mid-run pool-node purchase's price; the profile `POOL_NODES` are reused, so no new content node).
- `systems/RunFlow.ts` — `openDraft()` / `rerollOffer()` pass the run's pool's augment defs to `rollOffer` (the draft source swapped to the pool).
- `core/saveRun.ts` — `SavedRun.pool: string[]` (new field, the pool in the run's save) and its `loadSavedRun()` validation.
- `systems/RunSave.ts` — `persist()` includes `pool: run.pool`; `restore()` sets `run.pool`.
- `scenes/DraftScene.ts` (the existing pick scene) — a pool-node purchase panel (the "level pick scene": the panel where the mid-run pool-node purchases are made).
- `debug/runChecks.ts` — the pool's invariant.

### Interfaces
- `RunState.pool: string[]` — the run's pool of augment ids; its starter set at the run's start (`AUGMENTS` minus the augments the `POOL_NODES` unlock), grown by the mid-run pool-node purchase. The draft source is the pool: `RunFlow.openDraft()` / `rerollOffer()` pass `run.pool.map(id => getAugment(id))` (the pool's AugmentDefs) to `rollOffer`.
- `RunState.buyPoolNode(nodeId, cost): boolean` — the mid-run pool-node purchase: the node is in `POOL_NODES`, its `unlocks` is a known augment (in `AUGMENTS`), spend `cost` run gold, add its `unlocks` to `run.pool` (idempotent).
- `SavedRun.pool: string[]` — the pool in the run's save; `RunSave.persist` includes it, `RunSave.restore` sets `run.pool` (the starter set if the saved `pool` is absent in an old save).
- The pool-node purchase panel (the "level pick scene", a panel in the pick scene): lists the `POOL_NODES`; buying one (spend run gold) adds its `unlocks` to `run.pool`; the draft offers it from then on.

### Steps
1. `RunState.pool: string[]`, its starter set at the run's start (`AUGMENTS` minus the augments the `POOL_NODES` unlock — currently all 15 of `AUGMENTS`, since `haste`/`momentum`/`mend` aren't in the content yet); `buyPoolNode(nodeId, cost)`: the node is in `POOL_NODES`, its `unlocks` is a known augment, spend `cost` run gold, add its `unlocks` to `run.pool` (idempotent).
2. `RunFlow.openDraft()` / `rerollOffer()`: pass the pool's defs (the pool's ids, each `getAugment(id)`) to `rollOffer` — the draft source is the pool.
3. `SavedRun.pool: string[]`; `loadSavedRun` validates it (known-augment ids, no dupes, non-empty; absent in an old save → the starter set); `RunSave.persist` includes it; `RunSave.restore` sets `run.pool`.
4. The pool-node purchase panel (the "level pick scene"): list the `POOL_NODES`, buy one (spend run gold) to add its `unlocks` to `run.pool`; the draft offers it from then on.
5. The invariant in `INVARIANTS` (`run.pool`: every id is a known augment, no dupes, non-empty).

### Pitfalls
- The draft's `rollOffer` needs at least 3 candidates (`minPoolSize = 3`) or it throws (its guard); the pool must never drop below that. The starter set is all of `AUGMENTS` except the augments the `POOL_NODES` unlock — currently 15, so it's fine — and the mid-run purchase only adds, so it stays safe.
- The mid-run pool-node purchase is only draftable for augments that are in `AUGMENTS` (`getAugment` resolves them). The 3 current `POOL_NODES` (Haste/Momentum/Mend) unlock `haste`/`momentum`/`mend`, which are not in `AUGMENTS` yet — so those nodes' purchases add augments that aren't draftable yet (the nodes are stubs until their augments land in the content). Guard the purchase to only add an `unlocks` that's a known augment.
- `SavedRun` is written on phase changes (build/wave) and cleared on over; the pool is part of it; an old save without `pool` gets the starter set (forward-compat).
- The pool's ids must be known augments (in `AUGMENTS`) or `rollOffer` / `getAugment` throw; validate them in the invariant and in the save load.

### Tests
- `tests/core/run.test.ts` — the pool's starter set (`AUGMENTS` minus the `POOL_NODES`' `unlocks`), and `buyPoolNode`: spends run gold, adds the `unlocks`, is idempotent, and refuses an unknown node, a not-known-augment `unlocks`, or when the run is over.
- The save's tests (wherever `SavedRun` is tested) — a `SavedRun` with `pool` round-trips; an old save without `pool` gets the starter set; a broken `pool` (an unknown id, a dupe, empty) is rejected.
- The draft source: the draft offers only the pool's augments (a pool-node purchase makes its augment draftable).

## Dropped (by hand, 2026-10-30)

The levels epic (E3) is dropped: the player found the three-boards level rule (T0260) not fun, and it is being removed (see the inbox task "Remove the levels"). This task's level-clear pick has nothing to hang on, so it is dropped with the epic. Do not re-task it.
