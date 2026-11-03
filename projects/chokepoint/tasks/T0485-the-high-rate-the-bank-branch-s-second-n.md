---
id: T0485
title: "The high rate: the bank branch's second node, the rate 5% to 8%"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-03T10:07:19Z
epic: E29
---

## Goal
The bank branch's second node: 85 coins for the bank's rate 5% → 8% in every run after the buy, so a run that banks big earns more at each wave start and the deep vault's cap (T0483) binds later — the bank strategy gets its second real rung.

## Details
- The node: "The high rate" on the bank branch (the branch T0483 created), 85 coins by the depth rule, bought once like its siblings and on for every run after; the tech scene's bank row shows it (the row's owned/unowned pattern, T0369), and its node line names the effect in the branch's dry language ("the bank's rate 5% to 8%").
- The effect: the bank's pay at each wave start (T0363) uses the rate 8% instead of 5% — a 100-gold bank pays +8 where it pays +5 today; a 200-gold bank pays +16 where the old cap (+10) used to bind. The +1-up floor and the live cap (+10, or +20 with The deep vault) are untouched; the pay's own rounding rule is untouched.
- The reads: `core/tech.ts` gains the rate read `bankRate()` beside T0483's `bankPayCap()` (8 with the node, 5 without), and the run's pay path and the stats card's "bank +N" line read it, the way they already read the cap — no layout or text change to either, they simply show the live pay.
- The teach: the bank's one-time teach (T0431) is updated to wait on this node and build its line from the live rate, so an owner of the node hears "your gold pays 8% each wave" — T0431 is edited for that; this task does not touch its file.
- A run without the node is byte-identical: same pay at wave start, same "bank +N" line, same teach, same tests for the unowned case.

## Acceptance criteria
- [ ] The tech scene's bank row offers "The high rate" at 85 coins; buying it pays coins once, shows the owned mark, and is on for every run after.
- [ ] With the node owned, the wave-start bank pay is gold × 8% (min +1, capped by the live cap): 100 gold pays +8 (was +5), 200 gold pays +16 (was +10); without the node every pay is unchanged.
- [ ] `bankRate()` in `core/tech.ts` reads 8 with the node and 5 without; the stats card's bank line and the wave-start pay both read the live value with no layout change.
- [ ] A run without the node is byte-identical (same plans, same pays, same lines, same teach).
- [ ] Unit tests cover the node's row, price and buy refusal, `bankRate()` owned/unowned, and the pay at 8% under both caps.

## Design (architect, cachyos-x8664)

### Files
- edit `src/content/tech/bank.ts` - add `rate?` field to `BankNode` and the `high-rate` node entry
- edit `src/core/tech.ts` - add `bankRate()` after `bankPayCap()` (line 216)
- edit `src/core/bankInterest.ts` - add `rate` parameter (default 5)
- edit `src/systems/RunFlow.ts` - `bankPay()`: pass `bankRate(this.run.techOwned)` (1 line + import)
- edit `src/ui/hud/StatsCard.ts` - `update()`: pass `bankRate(game.run.techOwned)` (1 line + import)
- edit `tests/core/tech.test.ts` - bank row/price/buy tests + `bankRate` test
- edit `tests/core/bankInterest.test.ts` - pay at 8% under both caps

### Interfaces
```ts
// src/content/tech/bank.ts — add to the BankNode interface, after payCap:
  /** the bank's rate (core/tech's bankRate) while the node is owned (The high rate: 8); absent when the node doesn't touch the rate */
  rate?: number;
// and the node, after deep-vault in BANK_NODES:
  { id: 'high-rate', name: 'The high rate', line: "the bank's rate is 8%, not 5%", price: 85, rate: 8 },
// src/core/tech.ts — after bankPayCap (model on it exactly):
export function bankRate(owned: readonly string[]): number
// src/core/bankInterest.ts — new 3rd param:
export function bankInterest(gold: number, cap: number = 10, rate: number = 5): number
```

### Steps
1. `bank.ts`: add the `rate?` field (doc comment above) and the node entry. `price: 85` is the live `nodeCost` (base 30 at depth 2: `nodePrice(30, 2)` = 85); TechScene already renders `BANK_NODES` data-driven, so no scene edit.
2. `core/tech.ts`: add `bankRate` verbatim modelled on `bankPayCap` (loop over `BANK_NODES`, `node.rate !== undefined && node.rate > rate`), doc line: `The bank's rate for a run: 5, or the biggest owned node's rate (The high rate: 8); each node counts once, unknown ids count for nothing.`
3. `bankInterest.ts`: signature becomes `(gold, cap = 10, rate = 5)`; body `const pay = Math.floor((gold * rate) / 100); return pay >= 1 ? Math.min(pay, cap) : 0;` and update the 1-line doc to name the rate. The +1-up floor and cap are untouched.
4. `RunFlow.ts` line 125: `bankInterest(this.run.gold, bankPayCap(this.run.techOwned), bankRate(this.run.techOwned))`; add `bankRate` to the existing `import { bankPayCap } from '../core/tech'` (line 7). Same one-line edit in `StatsCard.ts` line 81 (and its line-7 import).
5. Tests: in `tests/core/tech.test.ts` update the existing bank-row test (line 427) — map to `[id, name, line, price, payCap, rate]` expecting `['deep-vault', ..., 30, 20, undefined]` and `['high-rate', 'The high rate', "the bank's rate is 8%, not 5%", 85, undefined, 8]`, plus `nodeCost(BANK_NODES, 'high-rate')).toBe(85)`; add `buyBankNode` refusal (84 coins < 85, already owned, buys at 200→115 with deep-vault owned); add `bankRate` test next to the `bankPayCap` one (5 with `[]`/other/unknown ids, 8 with `['high-rate']`, duplicates once). In `tests/core/bankInterest.test.ts` add: `bankInterest(100, 10, 8)` = 8, `bankInterest(101, 10, 8)` = 8 (floor), `bankInterest(13, 10, 8)` = 1 / `bankInterest(12, 10, 8)` = 0 (the +1-up floor), `bankInterest(200, 10, 8)` = 10 (old cap binds), `bankInterest(200, 20, 8)` = 16 and `bankInterest(250, 20, 8)` = 20 (deep cap).

### Pitfalls
- The exact-array `BANK_NODES.map` assertion in tech.test.ts (line 428) goes red if not extended — the node must carry `rate`, not `payCap`.
- Keep `Math.floor((gold * rate) / 100)` (integer product first); don't change the `>= 1` floor or the cap arg order — RunFlow/StatsCard call with all three args, existing single-arg calls stay 5%/cap 10 so unowned runs are byte-identical (bankRate([]) = 5).
- Don't touch the teach (T0431 edits it) or anything in `deep-vault`; `nodeInReach`/`nodeCost` pick the node up from `BANK_NODES` alone.

### Tests
- `tests/core/tech.test.ts`: bank row row/price/buy refusal + `bankRate` owned/unowned (as above).
- `tests/core/bankInterest.test.ts`: pay at 8% under caps 10 and 20.
