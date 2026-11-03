---
id: T0470
title: "The window: the kill branch's second node, the chain's window +0.5 s"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-03T04:20:47Z
epic: E25
---

## Goal
The tech's kill branch (T0466's row, just landed) gets its second node: between-run coins buy a longer kill chain — the chain's window +0.5 s (1.5 s → 2.0 s) — so a run's kills chain deeper, and the chain's existing pays (the ×N counter, the Feast buff, the combo milestone gold) land more often.

## Details
- **Tech screen:** the kill row (T0466) gains its second card, **The window**, at **85 coins** by the branch's depth rule (the bounty is the first at 30; T0214's branch discount applies as it does to every row). Same shape as the bounty card: name, one muted one-liner, coin cost, buy, and the owned dot once bought. One-liner: "The kill chain's window +0.5 s". Bought once with between-run coins, on for every run after — read from `run.techOwned` like the bounty, no new HUD anywhere.
- **The effect:** with the node owned, the kill chain's window is **2.0 s instead of 1.5 s** — a kill inside the window keeps the chain alive and extends it exactly as today; a gap longer than the window still breaks it. **Additive with Feast's added form:** window = 1.5 s + 0.5 s (node owned) + 0.4 s per Feast copy. The node's +0.5 s joins at the same single place the window is already computed (where Feast's `chainWindowSec` extends it), so the ×N counter, the ComboBar drain under it (T0220, which already rides Feast's +0.4 s), the Feast buff (T0235) and the combo milestone pays all follow one live window — no second read of the window anywhere.
- **Unowned is byte-identical:** without the node the window stays 1.5 s + 0.4 s per Feast copy and every chain pay is exactly today's.
- The deeper the run, the more the extra half second matters: chains already run long there, and the Feast and milestone pays ride the chain level.

## Acceptance criteria
- [ ] The tech screen's kill row shows two cards; the second is "The window" at 85 coins (with the branch discount applied as on every row), buyable when coins allow, and wearing the owned dot once bought.
- [ ] In a run with The Window owned, two kills 1.8 s apart keep the chain alive (the ×N counter keeps rising, the ComboBar keeps draining); in a run without the node, the same 1.8 s gap breaks the chain at 1.5 s.
- [ ] With one Feast copy and the node, the window is 2.4 s (2.0 + 0.4): kills 2.2 s apart still chain, and the ComboBar under the ×N counter takes 2.4 s to drain, not 1.5 s.
- [ ] The Feast buff and the combo milestone pays follow the extended window: a kill inside the window extends the chain level and pays exactly as before; nothing about how those pays are computed changes.
- [ ] Without the node, the window and every chain pay are byte-identical to today (1.5 s + 0.4 s per Feast copy).

## Design (architect, desktop)

### Files
- edit `src/content/tech/kill.ts` - add the `chainWindowSec` field to `KillNode` and the second node `The window` to `KILL_NODES`
- edit `src/core/tech.ts` - add `chainWindowBonus(owned)` right after `killBounty` (line 173)
- edit `src/systems/EnemySystem.ts` - add the node's +0.5 s at the one place the window is computed (line 284)
- edit `tests/core/tech.test.ts` - update the "kill row is one node" test and add `chainWindowBonus` + price tests

Nothing else changes: `TechScene` builds the kill row from `KILL_NODES` (`rows`, line 92), routes `branch === 'kill'` buys to `buyKillNode` (line 337), prices every card with `nodeCost(row, id)` (line 286) — which already returns 85 for the kill branch's depth-2 node (`nodePrice(30, 2)` = 85, the branch's first-node base of 30 scaled by depth^1.5 — the same rule as the exit row's 85). `buyKillNode` and `nodeInReach` already cover any `KILL_NODES` entry. The ×N counter, ComboBar drain, FeastGlow and `feastDamageMul` all read `fx.comboWindowMs`, so they follow the new value with no edits.

### Interfaces
In `KillNode` (after `bounty`):
```ts
  /** seconds the kill chain's window gains while the node is owned, additive with Feast's per-copy 0.4 s (The window: 0.5); absent when the node doesn't touch the window */
  chainWindowSec?: number;
```
In `core/tech.ts`, after `killBounty`:
```ts
/** The extra seconds the kill chain's window gets for the owned kill nodes: the sum of the owned nodes' chainWindowSec, 0 when none has one; each node counts once, unknown ids count for nothing. */
export function chainWindowBonus(owned: readonly string[]): number {
  let sec = 0;
  const seen = new Set<string>();
  for (const id of owned) {
    if (seen.has(id)) continue;
    seen.add(id);
    const node = KILL_NODES.find((n) => n.id === id);
    if (!node) continue;
    sec += node.chainWindowSec ?? 0;
  }
  return sec;
}
```

### Steps
1. `src/content/tech/kill.ts`: change the file's top comment to `/** The "The kill" branch: nodes for how a kill pays. */` (unchanged) and the list's comment to `/** Two nodes: The bounty (every kill pays +1 gold) and The window (the kill chain's window +0.5 s). */`; add the interface field above; append to the list:
   ```ts
   { id: 'window', name: 'The window', line: "the kill chain's window +0.5 s", price: 30, bounty: 0, chainWindowSec: 0.5 },
   ```
   `price` stays the branch base (30), exactly as `thin-road` does in `wave.ts` — the shown 85 comes from `nodeCost`, never hardcode it. `bounty: 0` is required (the field is not optional).
2. `src/core/tech.ts`: add `chainWindowBonus` after `killBounty` (line 173), placed with the other kill functions.
3. `src/systems/EnemySystem.ts`: line 12 becomes `import { blockLeakCost, chainWindowBonus, killBounty } from '../core/tech';`; lines 283–284 become:
   ```ts
   // The Feast copies on the board and the window node set the window this kill lives by, before the counter reads it (core/feast.ts, core/tech.ts).
   this.fx.comboWindowMs = feastChainWindowMs(this.feastCopies()) + 1000 * chainWindowBonus(this.run.techOwned);
   ```
   This is the only write of `fx.comboWindowMs` besides FxSystem's initial value — keep it that way.
4. `tests/core/tech.test.ts`: import `chainWindowBonus` on the existing `core/tech` import line (line 10); replace the `the kill row is one node for now…` test (line 367) with:
   ```ts
   it('the kill row is two nodes, The bounty at 30 and The window at 85 by the branch depth: +1 gold per kill, +0.5 s of chain window', () => {
     expect(KILL_NODES.map((n) => [n.id, n.name, n.line, n.price, n.bounty, n.chainWindowSec])).toEqual([
       ['bounty', 'The bounty', 'every kill pays +1 gold', 30, 1, undefined],
       ['window', 'The window', "the kill chain's window +0.5 s", 30, 0, 0.5],
     ]);
     expect(nodeCost(KILL_NODES, 'window')).toBe(85);
   });
   ```
   then after the `killBounty` test (line 378) add:
   ```ts
   it('chainWindowBonus is 0 with no, other-branch or unknown ids, 0.5 while The window is owned; duplicates count once', () => {
     expect(chainWindowBonus([])).toBe(0);
     expect(chainWindowBonus(['bounty', 'gold-1', 'nope'])).toBe(0);
     expect(chainWindowBonus(['window'])).toBe(0.5);
     expect(chainWindowBonus(['window', 'window', 'bounty'])).toBe(0.5);
   });

   it('the kill depth-2 node buys at 85 coins; 84 refuses', () => {
     expect(buyKillNode(withCoins(84), 'window')).toBe(false);
     const store = withCoins(100);
     expect(buyKillNode(store, 'window')).toBe(true);
     expect(loadProfile(store).coins).toBe(15);
   });
   ```
   Kill nodes have no prerequisites (`buyKillNode` checks none), so no `['bounty']` pre-own is needed.

### Pitfalls
- The existing test at `tests/core/tech.test.ts:367` asserts the kill row is exactly one node — it fails if left alone; it is step 4, not an add.
- Don't add a second window computation (in RunFlow, FxSystem or a hook): `fx.comboWindowMs` must keep its single write site, or the ComboBar and the ×N counter could disagree. FxSystem's field initializer stays `FEAST_CHAIN_BASE_MS`.
- `1000 * 0.5` is exact (500); the unowned path adds `+ 0`, so the window stays `1.5 s + 0.4 s per Feast` byte-identical.
- Don't hardcode 85 in data or scene code; `nodeCost` derives it, and the same rule already prices the exit row's depth-2 node.
- `runChecks.ts`'s `feast.window` invariant (`comboWindowMs >= FEAST_CHAIN_BASE_MS`) still holds with the bonus; no change.

### Tests
- `tests/core/tech.test.ts`: the two-node row shape + `nodeCost(KILL_NODES, 'window') === 85`, `chainWindowBonus` (0 / other-branch / unknown / 0.5 / dedupe), and the 85-vs-84 buy refusal — as written in step 4.
