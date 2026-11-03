---
id: T0475
title: "The milestone: the kill branch's third node, the chain's milestone pay ×2"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-03T05:56:47Z
epic: E25
---

## Goal
The tech's kill branch (T0466's row; The window landed as T0470) gets its third and last node: between-run coins buy a fatter chain milestone — the kill chain's milestone pay ×2, the 5th and 10th kill of a chain paying +4 and +8 gold instead of +2 and +4 — so a run's quick-kill chains pay for themselves deeper in the run.

## Details
- **Tech screen:** the kill row gains its third card, **The milestone**, shown at **155 coins** by the branch's depth rule (the bounty first at 30, the window second at 85; the shown price comes from the row's own nodeCost as on every row — the branch base is never hardcoded). Same card shape as the branch's other two: name, one muted one-liner, coin cost, buy, and the owned dot once bought. One-liner: "the chain's milestone pay ×2". Bought once with between-run coins, on for every run after, read from `run.techOwned` like the bounty and the window. No buy-gate inside the branch: it buys independently at its depth price, the way the window did (T0470). No new HUD anywhere.
- **The effect:** with the node owned, the chain's milestone pays double — the **5th kill of a kill chain pays +4 gold (was +2) and the 10th pays +8 (was +4)** — on every wave, in every mode. The node's ×2 joins at the single place the milestone gold is already computed (where the +2/+4 comes from), so every milestone pay the chain already makes comes out doubled, and the gold pop at the kill spot, the run's gold and everything else that reads the pay follow the one live value.
- **Nothing else moves:** the node only multiplies the milestone pay. How the milestone gold rides the quiet wave's ×2 or the last-stand ×2 is exactly as it is today for the +2/+4 — the node's multiplier sits on the same live value, in whatever order the code already uses. The chain's window, the ×N counter, the ComboBar, the Feast buff and the milestone's own look (the counter's yellow from ×10 up, its chime) are untouched.
- **Unowned is byte-identical:** without the node, the 5th and 10th kills of a chain pay +2 and +4 exactly as today, and the run is otherwise unchanged.

## Acceptance criteria
- [ ] The tech screen's kill row shows three cards; the third is "The milestone" at 155 coins (the depth rule's price for the branch's third depth, read from nodeCost), buyable on its own without the bounty or the window, and wearing the owned dot once bought; 154 coins refuses the buy.
- [ ] In a run with the node owned, the 5th kill of a chain pops +4 gold at the kill spot and the 10th pops +8; in a run without the node, the same chain pops +2 and +4; any other milestone pay the chain already makes is doubled the same way.
- [ ] The doubling holds in an Iron run and on a quiet wave: the quiet and the last stand ride the milestone pay exactly as they do today with the +2/+4, unchanged by the node.
- [ ] The chain's window, the ×N counter, the ComboBar, the Feast buff and the milestone's look (the counter's yellow from ×10, its chime) are untouched by the node.
- [ ] Without the node, every chain pay is byte-identical to today; unit tests cover the 3-node row shape, the 155 price, the ×2 pay (with dedupe and unknown ids, like the window's tests) and the buy refusal, and npm run check is green.

## Design (architect, inet-racing)

### Files
- edit `src/content/tech/kill.ts` - add an optional `milestoneMul` field to `KillNode` and append the third node to `KILL_NODES`.
- edit `src/core/tech.ts` - add a `milestoneMul(owned)` reader next to `killBounty`/`chainWindowBonus`.
- edit `src/systems/enemyHooks/comboGold.ts` - multiply the milestone bonus by `milestoneMul(run.techOwned)`.
- edit `tests/core/tech.test.ts` - update the kill-row shape test to 3 nodes, add the `milestoneMul` and 155-coins buy-refusal tests, add the import.

### Interfaces
`src/content/tech/kill.ts` — add to the `KillNode` interface, after `chainWindowSec?`:
```ts
/** the chain's milestone pay is multiplied by this while the node is owned (The milestone: 2); absent when the node doesn't touch the milestone pay */
milestoneMul?: number;
```
Append one node to `KILL_NODES` (one item per line, next to the other two — never a new "end" convention):
```ts
{ id: 'milestone', name: 'The milestone', line: "the chain's milestone pay ×2", price: 30, bounty: 0, milestoneMul: 2 },
```
`src/core/tech.ts` — new export, placed directly after `chainWindowBonus` (both are kill-node readers):
```ts
/** The multiplier on the chain's milestone gold for the owned kill nodes: the biggest owned node's milestoneMul, 1 when none has one; each node counts once, unknown ids count for nothing. */
export function milestoneMul(owned: readonly string[]): number {
  let mul = 1;
  const seen = new Set<string>();
  for (const id of owned) {
    if (seen.has(id)) continue;
    seen.add(id);
    const node = KILL_NODES.find((n) => n.id === id);
    if (!node) continue;
    if (node.milestoneMul !== undefined && node.milestoneMul > mul) mul = node.milestoneMul;
  }
  return mul;
}
```

### Steps
1. `kill.ts`: add the `milestoneMul?: number` field to `KillNode` (documented above), then append the milestone node to `KILL_NODES`. `price` stays `30` (the branch base — `nodeCost` recomputes by depth). `nodePrice(30, 3)` = 155 automatically; the TechScene card at `TechScene.ts:184` shows `nodeCost(row, node.id)`, so the third card reads 155 with no scene change, and `buy()` routes the kill branch to the existing `buyKillNode`.
2. `core/tech.ts`: add the `milestoneMul` export after `chainWindowBonus`. `KILL_NODES` is already imported at the top.
3. `enemyHooks/comboGold.ts`: add `import { milestoneMul } from '../../core/tech';` (next to the existing `comboGoldBonus` import) and change the bonus line to `const bonus = comboGoldBonus(fx.chain) * milestoneMul(run.techOwned);`. `run` is already captured in the hook's closure. Leave the `if (bonus <= 0) return;` guard, the `run.gold`/`run.goldEarned` adds and the `comboGoldPop` call untouched — they all read the one doubled `bonus`.
4. `tests/core/tech.test.ts`: (a) add `milestoneMul` to the `core/tech` import (between `leakWarnLead` and `nodeCost`); (b) rewrite the two-node kill-row test (lines 367–373) for three nodes, add `n.milestoneMul` to the mapped tuple, and assert `nodeCost(KILL_NODES, 'milestone')` is 155; (c) add a `milestoneMul` test mirroring the `chainWindowBonus` one (1 for no/other/unknown, 2 while owned, dedupe); (d) add a "kill depth-3 node buys at 155 coins; 154 refuses" test mirroring the depth-2 one.

### Pitfalls
- Do NOT change `core/comboGold.ts` or `comboGoldBonus`'s signature — the existing `tests/core/comboGold.test.ts` asserts `comboGoldBonus(5)===2`, `comboGoldBonus(10)===4` and must keep passing. The ×2 lives in the hook, combined with the tech multiplier, so the unowned run stays byte-identical (mul 1).
- T0425 also edits `enemyHooks/comboGold.ts` (a one-time chip); the runner serializes same-file tasks. Keep my change to exactly the import line plus the single `bonus` computation line so it composes either order — do not restructure the hook.
- `milestoneMul` uses the "biggest" pattern (start at 1, `if (... > mul)`), matching `boardLengthMul`/`sellRefund` — only one node sets it, so it returns 2 or 1.
- The milestone look (yellow counter from ×10, the chime, the ring) is driven by `FxSystem.killCount`/`fx.chain`, not by the gold — the doubled gold must not touch any of that.

### Tests
- `tests/core/tech.test.ts`: 3-node kill-row shape (ids/names/lines/prices/bounty/chainWindowSec/milestoneMul) + `nodeCost === 155`; `milestoneMul` (no/other-branch/unknown → 1, owned → 2, dedupe); buy-refusal (`withCoins(154)` refuses, `withCoins(155)` buys and coins hit 0). No test changes to `core/comboGold.ts`.
