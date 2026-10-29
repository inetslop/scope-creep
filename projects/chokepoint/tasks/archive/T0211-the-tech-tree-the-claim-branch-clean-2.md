---
id: T0211
title: "The tech tree: the claim branch — Clean ×2"
assignee: desktop
size: L
priority: 2
status: done
depends_on: [T0153]
attempts: 1
created: 2026-10-29T15:15:13Z
claimed_at: 2026-10-29T15:20:02Z
finished_at: 2026-10-29T15:27:49Z
epic: E2
---

## Goal
The tech tree grows a fifth branch, “The claim”, whose nodes change what a run pays: the first node, “Clean ×2”, makes each clean wave pay 2 coins instead of 1 — so holding the line cleanly is worth coins across runs, not only the in-run streak life and Momentum's damage bonus.

## Details
- The tech screen (T0103) gains a fifth branch row, “The claim”, with one node card: “Clean ×2” — 30 coins — card line: “each clean wave pays 2 coins instead of 1.” T0153's row and card look, and T0103's states (affordable bright, unaffordable dimmed with a red price, owned with the yellow border). No gate state — unlike the pool nodes, the effect is in the game the moment the node is bought.
- The row is appended at the end of the rows list (after the pool row; the board branch's row, T0208, lands beside it in either order).
- The effect: the clean term of the run's coin formula (T0001's `coinsForRun` in core/profile.ts — waves + floor(stopped/10) + clean) doubles: each clean wave pays 2 coins instead of 1, for the whole run, from the first clean wave on. The formula stays one pure function; the node's owned state (from the profile's purchased list, node id `clean2`) is read where the formula is applied — the way the other branches' effects are read. The node id is free (there is no augment to match); `clean2` keeps it short.
- Every readout of the run's coins reads that one formula, so all of them show the change with no per-scene logic: the live “+N coins” tally in the stats card (T0013), the pause card's “worth +N coins” line (T0087) and the claim card's count-up with its recipe line (T0047, T0075) — with the node owned, the recipe's clean term reads 2× the run's clean count.
- A run without the node (a first-time player) is byte-identical: same formula, same three readouts, same recipe line as today.
- Buying: 30 coins, T0103's balance pop + two-note chime, the owned state, saved to the profile's purchased list — a buy is permanent and survives a reload.
- This task owns the branch, the node and the formula's clean term. It does not touch the in-run clean chip (T0005), the clean streak (T0045) or Momentum's clean-wave bonus (T0064) — “a clean wave” keeps exactly today's meaning (zero leaks, the same wave those three use).

## Acceptance criteria
- [ ] The tech screen shows a fifth row “The claim” with one node card “Clean ×2” priced 30, T0103's card look; at 412×915 and 1280×720 the row is visible and the node is buyable (the scroll cue behaving as today).
- [ ] Buying it pays 30 coins with T0103's pop + chime, shows the owned (yellow border) state and survives a reload; the run-start, draft, pool and board rows and their states are untouched.
- [ ] A run with the node owned: each clean wave adds 2 to the run's coin tally — the live tally, the pause worth line and the claim card all agree — and the claim card's recipe line reads the doubled clean term (e.g. 3 clean waves → “clean +6”).
- [ ] A run without the node is byte-identical: the formula, the three readouts and the recipe line read exactly as today (1 clean wave → “clean +1”).
- [ ] Unit tests: the formula with and without the node (clean counts 0, 1, 4 → clean terms 0/1/4 vs 0/2/8, the other terms unchanged); the node purchase (unknown id / already owned / 29 coins → refused, coins unchanged; success deducts exactly 30 and saves `clean2` in the purchased list); the branch's content row maps to the single node.

## Design (architect, desktop)

### Files
- create `src/content/tech/claim.ts` — the "The claim" branch data (`ClaimNode`, `CLAIM_NODES`) plus `cleanWavePay()`, the owned-state read the formula uses. No imports.
- edit `src/core/profile.ts` — `coinsForRun` gains a defaulted `cleanPay` parameter; `recordRun` reads the node from the profile it already loads.
- edit `src/core/tech.ts` — import `CLAIM_NODES`, add `buyClaimNode` directly after `buyPoolNode`.
- edit `src/scenes/TechScene.ts` — third row, third `ROW_LABELS` entry, a `branch` field on `RowNode`, and the buy dispatch on `branch`.
- edit `src/ui/hud/StatsCard.ts` — cache the clean pay in the constructor, pass it to `coinsForRun` in `update()`.
- edit `src/scenes/PauseScene.ts` — pass the pay into its `coinsForRun` call (it already loads `profile`).
- edit `src/scenes/RewardsScene.ts` — pass the pay into the fallback `coinsForRun`, double the recipe's clean term.
- edit `tests/core/profile.test.ts`, `tests/core/tech.test.ts` — new cases below.

### Interfaces
```ts
// src/content/tech/claim.ts
export interface ClaimNode { id: string; name: string; line: string; price: number; /** coins one clean wave pays while this node is owned. */ pay: number; }
export const CLAIM_NODES: readonly ClaimNode[] = [
  { id: 'clean2', name: 'Clean ×2', line: 'each clean wave pays 2 coins instead of 1', price: 30, pay: 2 },
];
export function cleanWavePay(owned: readonly string[]): number {
  const node = CLAIM_NODES.find((n) => owned.includes(n.id));
  return node ? node.pay : 1;
}
// core/profile.ts
export function coinsForRun(result: RunResult, cleanPay = 1): number; // body: result.waves + Math.floor(result.stopped / 10) + result.clean * cleanPay
// core/tech.ts
export function buyClaimNode(store: KeyValueStore | undefined, id: string): boolean; // copy of buyPoolNode over CLAIM_NODES, same refusal order and comment style
```

### Steps
1. Create `src/content/tech/claim.ts` as above (model the header comment on `pool.ts`).
2. `src/core/profile.ts`: add `import { cleanWavePay } from '../content/tech/claim';`; change `coinsForRun` to the signature/body above (keep the doc comment, note the 2 with the claim node); in `recordRun` change line 85 to `const coins = coinsForRun(result, cleanWavePay(old.purchased));`.
3. `src/core/tech.ts`: add `import { CLAIM_NODES } from '../content/tech/claim';` next to the pool import; append `buyClaimNode` after `buyPoolNode` (identical body with `POOL_NODES` → `CLAIM_NODES`, doc comment: no prerequisites, no gate — the effect is in the run the moment it is bought).
4. `TechScene.ts`: import `CLAIM_NODES` and `buyClaimNode`; add `branch: 'start' | 'pool' | 'claim'` to `RowNode` and set it in each of the three `rows` mappers (add the claim mapper after the pool one, `requires: null, unlocks: null, branch: 'claim'`); `ROW_LABELS = ['Run start', 'The pool', 'The claim']`; in `buy()` keep the pool gate line and replace the ternary with a dispatch on `node.branch` (`start` → `buyNode`, `pool` → `buyPoolNode`, else `buyClaimNode`).
5. `StatsCard.ts`: add field `private readonly cleanPay: number;`, init in the constructor right after `this.scene = scene;` with `cleanWavePay(loadProfile(window.localStorage).purchased)` (`loadProfile` already imported); pass `this.cleanPay` as the second `coinsForRun` argument in `update()`.
6. `PauseScene.ts`: append `, cleanWavePay(profile.purchased)` to the `coinsForRun` call at line 49.
7. `RewardsScene.ts`: in `create()`, load `const profile = loadProfile(window.localStorage); const lastRun = profile.lastRun; const cleanPay = cleanWavePay(profile.purchased);`; pass `cleanPay` in the fallback `coinsForRun` (line 52) and change the recipe line's `clean +${this.clean}` to `clean +${this.clean * cleanPay}`.
8. Add the tests below.

### Pitfalls
- The `branch` field is mandatory: with `unlocks === null`, the current `node.unlocks === null ? buyNode : buyPoolNode` dispatch would route the claim purchase into `buyNode`, which finds no node and refuses silently — the card would look buyable and never buy.
- Never `loadProfile` in `StatsCard.update()` (every frame); cache once in the constructor — the profile can't change mid-run, the tech screen is only reachable from the menu.
- The `coinsForRun` parameter is `cleanPay` and the imported function `cleanWavePay` — don't name both the same, or the parameter shadows the import in `recordRun`'s file.
- Byte-identical without the node: the defaulted `= 1` keeps every existing call and test unchanged; change no format strings elsewhere.
- Layout needs no code: the `geoms` loop grows the panel per row and the existing drag + arrow handle overflow — don't touch it. (The board row from T0208 lands beside yours in the same list; the runner serializes those shared-file edits.)
- Use the multiplication sign `×` in the node name; don't touch the in-run clean chip, clean streak, or Momentum.

### Tests
- `tests/core/profile.test.ts`: with pay 2, clean 0/1/4 → total 0/2/8 (and `waves 12, stopped 148, clean 5` → 36 vs today's 31, proving other terms unchanged); `recordRun` with `purchased: ['clean2']` stores `waves 1, stopped 10, clean 3` as 8 coins, and with no purchase as 5.
- `tests/core/tech.test.ts` (import `CLAIM_NODES`, `cleanWavePay`, `buyClaimNode`): the claim row maps to the single node `['clean2', 'Clean ×2', 30, 2]`; `cleanWavePay([])` 1 / `(['clean2'])` 2 / unknown ids 1; `buyClaimNode` refuses unknown id, 29 coins, and already owned (coins unchanged in each), and a success deducts exactly 30 and appends `'clean2'` to the purchased list.

## Result (attempt 1, desktop)

Added the tech tree's "The claim" branch with its single node "Clean ×2" (30 coins, `src/content/tech/claim.ts` + `buyClaimNode` in `core/tech.ts`), wired as a third row in TechScene with a branch-based buy dispatch. The run's coin formula (`coinsForRun` in `core/profile.ts`) now takes a defaulted `cleanPay` multiplier for the clean term, read from the owned `clean2` node in `recordRun` and passed by the three coin readouts — the live stats-card tally (cached in the constructor), the pause card's worth line, and the claim card's count-up plus recipe line (e.g. "clean +6" for 3 clean waves). Runs without the node are byte-identical (default pay 1, no format changes). Unit tests cover the formula with/without the node, the purchase (refusals and the 30-coin deduction saving `clean2`), and the branch's content row; `npm run check` and `npm run smoke` both pass.

- Self-review: APPROVE
- Time: 7.8 min

```
projects/chokepoint/game/src/content/tech/claim.ts | 20 +++++++++++++++
 projects/chokepoint/game/src/core/profile.ts       | 10 +++++---
 projects/chokepoint/game/src/core/tech.ts          | 21 +++++++++++++++
 projects/chokepoint/game/src/scenes/PauseScene.ts  |  3 ++-
 .../chokepoint/game/src/scenes/RewardsScene.ts     |  9 ++++---
 projects/chokepoint/game/src/scenes/TechScene.ts   | 26 ++++++++++++-------
 projects/chokepoint/game/src/ui/hud/StatsCard.ts   |  9 +++++--
 .../chokepoint/game/tests/core/profile.test.ts     | 15 +++++++++++
 projects/chokepoint/game/tests/core/tech.test.ts   | 30 +++++++++++++++++++++-
 9 files changed, 123 insertions(+), 20 deletions(-)
```
