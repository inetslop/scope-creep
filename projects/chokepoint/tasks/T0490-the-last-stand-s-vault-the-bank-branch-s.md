---
id: T0490
title: "The last stand's vault: the bank branch's third node, the pay doubles at one life"
assignee: inet-racing
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-03T11:18:16Z
claimed_at: 2026-11-03T11:55:39Z
epic: E29
---

## Goal
The bank branch (T0483's The deep vault, T0485's The high rate) is the tech's newest row; its third and final node is the last one — between-run coins buy the bank paying double in the run's most dangerous moment, so a run that banks deep is richest exactly when it is one leak from over.

## Details
- The "The bank" branch's third node, "The last stand's vault", 155 coins by the branch's depth rule (the row reads 30 / 85 / 155), bought once like its siblings and on for every run after the buy.
- While it is owned and the run is at exactly 1 life, the bank's pay at each wave start is doubled: the normal pay (the live rate on the run's gold, floored at +1, capped by The deep vault's +20 or the plain +10) is computed first, then ×2 while at 1 life. A +8 pay becomes +16; with The deep vault's +20 cap the last-stand pay tops out at +40. At 2 or more lives the pay is unchanged — byte-identical to an unowned run at those lives.
- The stats card's "bank +N" line (T0374) shows the doubled N while the run is at 1 life, so the boost is visible in the build phase before the wave starts; the pay and the shown number always agree.
- The pay is taken at the same two moments the bank already pays (the countdown's end and the big button's early send), on top of the banked seconds-gold, exactly as today — only the amount is doubled at one life.

## Acceptance criteria
- [ ] The tech screen's "The bank" row shows three nodes, the third reading "The last stand's vault" at 155 coins; buying it needs 155+ coins and it wears the owned mark once bought.
- [ ] In a run with the node owned at exactly 1 life, the bank pays twice what it would at 2 lives for the same gold (e.g. 100 gold at the 8% rate pays +16 instead of +8), and the stats card's "bank +N" line shows the doubled number during the build.
- [ ] A run without the node, or any run at 2 or more lives, pays the bank byte-identically to today; the unowned path is untouched.
- [ ] The node is on for every run after the buy, including resumed runs; The deep vault's cap and The high rate's rate still apply before the doubling.

## Design (architect, inet-racing)

### Files
- edit `src/content/tech/bank.ts` — add `lastStand?: boolean` field to `BankNode`; add the third node to `BANK_NODES`
- edit `src/core/bankInterest.ts` — add `bankDue()`: the normal pay, then ×2 while the last stand is on
- edit `src/core/tech.ts` — add `bankLastStand(owned)` right after `bankRate` (line 230), not at the file end (other tasks append to tech.ts)
- edit `src/systems/RunFlow.ts` — `bankPay()` (line 125) and `startWaveNow`'s path pay via `bankDue`; the pay's `+N` pop (line 128) then shows the doubled number for free
- edit `src/ui/hud/StatsCard.ts` — the "bank +N" line (line 81) uses the same `bankDue` call, so shown and paid always agree
- edit `tests/core/tech.test.ts` — bank row test, `nodeCost`, `bankLastStand`, buy tests
- edit `tests/core/bankInterest.test.ts` — `bankDue` tests

### Interfaces
```ts
// content/tech/bank.ts — on BankNode, after `rate?`:
/** the bank's pay is doubled while the last stand is on (core/tech's bankLastStand): true on The last stand's vault */
lastStand?: boolean;
// BANK_NODES gains one entry after 'high-rate':
{ id: 'last-stand-vault', name: "The last stand's vault", line: "the bank's pay is doubled at one life", price: 155, lastStand: true },

// core/bankInterest.ts — after bankInterest:
/** The bank's pay with The last stand's vault: the normal pay (bankInterest, floor and cap first), then ×2 while the last stand is on. */
export function bankDue(gold: number, cap: number, rate: number, lastStand: boolean): number {
  const pay = bankInterest(gold, cap, rate);
  return lastStand ? pay * 2 : pay;
}

// core/tech.ts — after bankRate (style of its siblings):
/** The bank's pay doubling: on while a bank node with lastStand is owned (The last stand's vault); each node counts once, unknown ids count for nothing. */
export function bankLastStand(owned: readonly string[]): boolean {
  const seen = new Set<string>();
  for (const id of owned) {
    if (seen.has(id)) continue;
    seen.add(id);
    const node = BANK_NODES.find((n) => n.id === id);
    if (node?.lastStand) return true;
  }
  return false;
}
```

### Steps
1. `bank.ts`: add the field and the node entry exactly as above. The display price must equal the depth rule: `nodeCost(BANK_NODES, 'last-stand-vault')` = `nodePrice(30, 3)` = `round(30·3^1.5/5)·5` = 155. TechScene, the owned mark and `buyBankNode` (line 429) are all generic over `BANK_NODES` — no scene changes.
2. `bankInterest.ts`: add `bankDue` as above (do not change `bankInterest`).
3. `tech.ts`: add `bankLastStand` after `bankRate` (line 230).
4. `RunFlow.ts`: change line 125 to
   `const pay = bankDue(this.run.gold, bankPayCap(this.run.techOwned), bankRate(this.run.techOwned), bankLastStand(this.run.techOwned) && isLastStand(this.run));`
   and extend its doc comment (line 122) with "doubled while the last stand is on (core/tech's bankLastStand)". Imports: line 6 becomes `import { bankDue } from '../core/bankInterest';`; line 7 becomes `import { bankLastStand, bankPayCap, bankRate } from '../core/tech';`; add `import { isLastStand } from '../core/lastStand';` between the `farGate` and `path` imports (lines 8–9).
5. `StatsCard.ts`: line 81 becomes
   `const interest = bankDue(game.run.gold, bankPayCap(game.run.techOwned), bankRate(game.run.techOwned), bankLastStand(game.run.techOwned) && isLastStand(game.run));`
   Imports: line 6 becomes `import { bankDue } from '../../core/bankInterest';`; line 7 gains `bankLastStand`. `isLastStand` is already imported (line 9). The row's `interest >= 1` gate and card grow/shrink (lines 82, 116–125) are untouched — a doubled 0 stays hidden, a doubled 1 shows `bank +2`.
6. Tests:
   - `tests/core/bankInterest.test.ts` — add `describe('bankDue')` after the existing describe: `bankDue(100, 10, 5, false) === bankInterest(100, 10, 5)` and `bankDue(250, 20, 8, false) === 20` (undoubled is exactly the normal pay); `bankDue(100, 10, 8, true) === 16` (the task's example), `bankDue(101, 10, 8, true) === 16` (floor before doubling), `bankDue(12, 10, 8, true) === 0` (nothing doubles into a something), `bankDue(500, 20, 8, true) === 40` (deep cap binds, then ×2), `bankDue(250, 20, 8, true) === 40`, `bankDue(500, 10, 8, true) === 20` (plain cap).
   - `tests/core/tech.test.ts`: retitule the test at line 427 to "the bank row is three nodes: …, and The last stand's vault at 155 (the pay doubled at one life)"; extend the mapped tuple with `n.lastStand` and all three rows (the two old ones get a trailing `undefined`, the new one `true`); add `expect(nodeCost(BANK_NODES, 'last-stand-vault')).toBe(155);` after line 433; after the `bankRate` test (line 448) add `bankLastStand` off for `[]`, `['deep-vault', 'high-rate', 'nope']`, on for `['last-stand-vault']` and `['bounty', 'last-stand-vault', 'last-stand-vault']`; after line 475 add a buy test modeled on line 464: `withCoins(154, ['deep-vault', 'high-rate'])` refuses (154 < 155), `withCoins(200, [..., 'last-stand-vault'])` refuses (owned), `withCoins(200, ['deep-vault', 'high-rate'])` buys, coins 45, `purchased` `['deep-vault', 'high-rate', 'last-stand-vault']`.

### Pitfalls
- Byte-identity: the unowned path must be `bankDue(..., false)` returning `bankInterest(...)` verbatim — no extra floor/round after the ×2 (integer ×2 is exact). `tests/systems/runFlow.test.ts` (techOwned `[]`) must pass unchanged.
- Cap and floor apply before doubling (that is why `bankDue` doubles `bankInterest`'s result, never the raw percentage) — at 8% with the deep vault the top is +40, not "8% doubled then capped at 20".
- Use `isLastStand(run)`, not `run.lives === 1`: Iron mode's single life is deliberately not a last stand, consistent with every other last-stand effect (kill gold, quiet tag).
- Pay and shown N must share one expression (`bankDue` at both call sites); never derive one from the other.
- `tech.ts` and `tech.test.ts` are also edited by open tasks (T0370, T0433, T0477); keep every insertion next to its bank siblings, never at a file end.
- No new HUD element, input, mark or sound: the row, pop, coin and card grow already exist.

### Tests
- As in step 6: `bankDue` in `tests/core/bankInterest.test.ts`; row/nodeCost/`bankLastStand`/buy in `tests/core/tech.test.ts`. These lock the rule (floor/cap before doubling, depth-3 price, owned-flag scan) against silent later edits.
