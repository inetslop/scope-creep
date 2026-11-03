---
id: T0483
title: "The bank: the tech's next row and its first node, The deep vault"
assignee: desktop
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-03T08:53:31Z
claimed_at: 2026-11-03T09:33:46Z
epic: E29
---

## Goal
The tech tree has covered run start, board, pool, claim, wave, tower management, exit, draft, kill and strike — but not the run's own bank: a new row, **The bank**, lets between-run coins buy how the gold the run banks pays. Its first node, **The deep vault** (30 coins), raises the bank's pay cap from +10 to +20, so a run that banks past 200 gold earns up to twice as much at each wave start, in every run after.

## Details
- **Tech screen:** a new row "The bank" at the end of the branch list (after the last existing row — The strike's once it has landed, The kill's before it), with its first card, **The deep vault**, shown at **30 coins** — the branch's base, the shown price from the row's own nodeCost as on every row (the branch base is never hardcoded). Same card shape as every branch: name, one muted one-liner, coin cost, buy, and the owned dot once bought. One-liner: "the bank's pay is capped at +20, not +10". Bought once with between-run coins, on for every run after, read from `run.techOwned` like the bounty (T0466). No buy-gate inside the branch: it buys independently at its depth price. The menu's Tech dot (T0213) lights for it through the row's own nodeCost, as for every branch. The TechScene's header counts the branch in its row list. No new HUD anywhere, and no new input.
- **The effect:** with the node owned, the bank's pay is capped at +20 instead of +10 (the 5% rate and the paid-from-+1-up floor untouched) — a new pure read in `core/tech.ts` (10 without the node, 20 with it) that the run passes through `core/bankInterest.ts` (which gains the cap as a parameter, defaulting to today's +10) at the bank's pay moments, the way the bounty is read live from `run.techOwned` (T0466). The stats card's "bank +N" line (T0374) reads the same computation, so it shows the raised cap with no change of its own; the coins reference (T0329), if it names the bank's rate or cap, reads the same computation too. T0431's one-time teach names the rate only ("your gold pays 5% each wave") and stays true — leave it untouched.
- **When it matters:** the cap binds above 200 gold (5% of 200 is 10): a run that spends as it goes feels nothing, and a run that banks past 200 gold pays +15 at 300 and +20 at 400 instead of +10 — the hoard-vs-spend choice (T0363) gets a deeper reward for the hoard.
- **Nothing else moves:** the rate, the floor, the pay's moment (the countdown end and the big button's early send, T0223), kill gold, wave bonus, coins and the last stand all behave exactly as today — the node only raises the cap.
- **Unowned is byte-identical:** without the node, every bank pay and every readout is exactly as today, and the tech screen is otherwise unchanged.

## Acceptance criteria
- [ ] The tech screen shows a new row, "The bank", at the end of the branch list, with one card: "The deep vault" at 30 coins (the depth-1 price from nodeCost), buyable on its own, wearing the owned dot once bought; 29 coins refuses the buy.
- [ ] In a run with the node owned, the bank pays +20 at 400 gold and +15 at 300 gold; in a run without the node the same gold pays +10 and +10, and at 100 gold both pay +5 (the cap never binds below 200).
- [ ] The raised cap rides both pays: the countdown end and the big button's early send pay it, and the stats card's "bank +N" line shows the raised number during the build phase.
- [ ] The rate (5%), the floor (paid from +1 up), the pay's moment, kill gold, wave bonus, coins and the last stand are untouched by the node; T0431's teach still reads "your gold pays 5% each wave".
- [ ] Without the node, every bank pay and readout is byte-identical to today; unit tests cover the row shape, the 30 price, the cap read (with dedupe and unknown ids, like the bounty's tests) and the buy refusal, and npm run check is green.

## Design (architect, desktop)

### Files
- create `src/content/tech/bank.ts` - the new "The bank" branch data (one node, The deep vault)
- edit `src/core/bankInterest.ts` - gain a cap parameter, default 10
- edit `src/core/tech.ts` - import, `bankPayCap()` read, `buyBankNode()`, `nodeInReach` branch list
- edit `src/systems/RunFlow.ts` - pass the raised cap into `bankPay()`
- edit `src/ui/hud/StatsCard.ts` - pass the raised cap into the "bank +N" line
- edit `src/scenes/TechScene.ts` - the new row, label, branch union, buy dispatch, doc count
- edit `tests/core/tech.test.ts` - row shape, price, cap read, buy refusal, `nodeInReach`/`nodeCost` lists
- edit `tests/core/bankInterest.test.ts` - the raised cap's pays

### Interfaces
```ts
// src/content/tech/bank.ts (new file, model on content/tech/kill.ts)
export interface BankNode {
  id: string;
  name: string;
  line: string;
  price: number;
  /** the bank's pay cap (core/bankInterest) while the node is owned (The deep vault: 20); absent when the node doesn't touch the cap */
  payCap?: number;
}
export const BANK_NODES: readonly BankNode[] = [
  { id: 'deep-vault', name: 'The deep vault', line: "the bank's pay is capped at +20, not +10", price: 30, payCap: 20 },
];

// src/core/tech.ts
export function bankPayCap(owned: readonly string[]): number; // 10 without the node, 20 with it; dedupe + unknown ids like killBounty
export function buyBankNode(store: KeyValueStore | undefined, id: string): boolean; // clone of buyKillNode with BANK_NODES
// src/core/bankInterest.ts
export function bankInterest(gold: number, cap: number = 10): number; // body: Math.min(pay, cap) instead of Math.min(pay, 10)
```

### Steps
1. Create `src/content/tech/bank.ts` exactly as above (header comment: `/** The "The bank" branch: nodes for how the run's bank pays. */`).
2. `src/core/bankInterest.ts`: signature `bankInterest(gold: number, cap: number = 10)`, `Math.min(pay, cap)`; extend its header comment with "capped (10 by default; The deep vault's 20 via core/tech's bankPayCap)".
3. `src/core/tech.ts`: add `import { BANK_NODES } from '../content/tech/bank';` after the KILL_NODES import; add `bankPayCap()` between `milestoneMul` (ends line 201) and `nodePrice`, modeled line-for-line on `killBounty` (loop with `seen` Set, `BANK_NODES.find`, `if (node.payCap !== undefined && node.payCap > cap) cap = node.payCap;`, start `cap = 10`); append `buyBankNode` after `buyKillNode` (same body as `buyKillNode` with `BANK_NODES`); in `nodeInReach` add `BANK_NODES` to the branch array after `KILL_NODES`.
4. `src/systems/RunFlow.ts`: add `import { bankPayCap } from '../core/tech';` after the `bankInterest` import; in `bankPay()` change to `const pay = bankInterest(this.run.gold, bankPayCap(this.run.techOwned));` and update its doc line to "5% of the run's gold, at the bank's cap (core/tech's bankPayCap), exactly once per wave".
5. `src/ui/hud/StatsCard.ts`: add `import { bankPayCap } from '../../core/tech';` after the `bankInterest` import; line 80 becomes `const interest = bankInterest(game.run.gold, bankPayCap(game.run.techOwned));`.
6. `src/scenes/TechScene.ts`: import `BANK_NODES` (after the KILL_NODES import) and add `buyBankNode` to the `../core/tech` import (before `buyBoardNode`); add `| 'bank'` to the `RowNode.branch` union; append `'The bank'` to `ROW_LABELS`; append the row `BANK_NODES.map((n) => ({ id: n.id, name: n.name, line: n.line, price: n.line === node.line ? node.line : node.line, ... }))` — no, exactly: `BANK_NODES.map((n) => ({ id: n.id, name: n.name, line: n.line, price: n.price, requires: null, unlocks: null, branch: 'bank' })),` as the last entry of `rows` (after the KILL_NODES row; if T0477's strike row has landed, after that row — the label index must match the row index); in `buy()`, insert `node.branch === 'bank' ? buyBankNode(window.localStorage, node.id) :` immediately before the `node.branch === 'kill'` case; in the class doc comment change "Nine branches" to "Ten branches" and append `and "The bank" (how the run's bank pays)` after "The kill" (how a kill pays)".
7. Tests, exactly as in the Tests section below.
8. Run `npm run check`.

### Pitfalls
- The `nodeInReach` test ("every node owned", ~line 462) fails unless `...BANK_NODES` is added to both its spreads — the dot would stay lit with 99999 coins.
- The `buy()` ternary falls through to `buyBoardNode`; without an explicit `'bank'` case the node is silently unbuyable.
- `ROW_LABELS[r]` is indexed by row position: label and row must be appended at the same spot.
- Unowned must stay byte-identical: keep the default `cap = 10`; do not touch the 5% rate, the `pay >= 1` floor, `kill gold`, wave bonus or `CoinsScene` (it names no bank rate or cap). T0431's teach is untouched.
- The 1-card row renders centered in narrow via the existing `lastOdd` logic; the panel just grows taller and the existing scroll handles 412x915 — no layout code changes.

### Tests
- `tests/core/tech.test.ts`: import `BANK_NODES` (from `../../src/content/tech/bank`) plus `bankPayCap, buyBankNode` into the `../core/tech` import. Add after the kill buy test (~line 424): (a) row shape — `BANK_NODES.map((n) => [n.id, n.name, n.line, n.price, n.payCap])` toEqual `[['deep-vault', 'The deep vault', "the bank's pay is capped at +20, not +10", 30, 20]]` and `nodeCost(BANK_NODES, 'deep-vault')` toBe 30; (b) `bankPayCap` — 10 for `[]`, `['gold-1', 'bounty', 'nope']`; 20 for `['deep-vault']` and `['deep-vault', 'deep-vault', 'bounty']`; (c) buy — `buyBankNode(withCoins(60), 'nope')` false; `withCoins(29)` refuses and stays 29; `withCoins(60, ['deep-vault'])` refuses and stays 60; `withCoins(60, ['bounty'])` buys, leaves 30 coins, purchased `['bounty', 'deep-vault']`. Also append `expect(nodeCost(BANK_NODES, 'deep-vault')).toBe(30);` to the nodeCost test (after the KILL_NODES line, ~446) and `...BANK_NODES` to both spreads in the nodeInReach test (~462-463).
- `tests/core/bankInterest.test.ts`: add a test — with cap 20: `bankInterest(300, 20)` 15, `bankInterest(400, 20)` 20, `bankInterest(500, 20)` 20, and unchanged below the old cap: `bankInterest(100, 20)` 5, `bankInterest(200, 20)` 10.
