---
id: T0313
title: "The claim branch's second node: Flawless pays 10 coins"
size: M
priority: 1
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T00:11:52Z
epic: E9
---

## Goal
The tech tree's claim branch grows a deeper node — "Flawless": a flawless run pays 10 coins. A perfect run finally pays in coins, not only the star, and the extra coins the level multipliers pour in (E9) have a deep node worth saving for.

## Details
- A new node in the claim branch ("The claim", T0211), the branch's second: name "Flawless", price 85 coins — computed by the depth rule (T0288: base × depth^1.5, rounded to a multiple of 5, the branch's base 30 being its first node's price), buyable only after the branch's first node (Clean ×2) is owned, like the deeper nodes of the other branches (T0215's pattern).
- Effect: while the node is owned, a flawless run (T0076's exact rule: every completed wave held clean, at least one held; the death wave never counts) pays 10 coins more on the claim.
- The one coin formula (T0001, `coinsForRun` in `src/core/profile.ts`) gains the term: +10 while the node is owned and every wave held so far is clean (at least one held). The term drops off for the rest of the run the moment a held wave is not clean. The live coin tally (stats card), the pause's worth line (T0087) and the claim card all read it through the same formula — no second copy of the rule.
- The claim card's recipe line (T0075) gains a "flawless +10" term, shown only when it applies; with the level-augment multiplier term on the same line it must still fit at 412x915 (wrap within the card if needed).
- The tech screen: the node card reads "Flawless" with the description "a flawless run pays 10 coins", price 85, the owned mark after buying — the existing node-card pattern (the row and the buy dispatch are generic, T0211/T0215); the card's text fits at 412x915 and 1280x720.
- No new run field: flawlessness is read from the run's ledger (held vs clean waves), the node from the profile — a resumed run keeps the behavior with no new save state.
- The Flawless star line (T0076, claim and game-over cards) is untouched — the star stays, the node adds the coins. Iron runs can earn it like any run.

## Acceptance criteria
- [ ] The tech screen's claim branch shows a second node "Flawless" at 85 coins, quiet until Clean ×2 is owned, and buying it for 85 coins shows the owned mark.
- [ ] With the node owned, a run that holds every completed wave clean pays +10 coins on the claim and the recipe line shows the "flawless +10" term; the same run without the node pays no flawless coins.
- [ ] Mid-run, while every held wave so far is clean, the live coin tally (stats card) and the pause's worth line include the 10; one leak in a held wave drops them off for the rest of the run.
- [ ] The node's price is computed by the depth rule (T0288), not hardcoded: 85 for the claim branch's depth 2.
- [ ] A resumed run behaves the same: the node comes from the profile, the flawless state from the run save, no new save field written.
- [ ] The node card and the full recipe line fit at 412x915 and 1280x720.

## Design (architect, desktop)

### Files
- edit `src/content/tech/claim.ts` — add `flawless: number` and `requires: string | null` to `ClaimNode`, add the second node, add `flawlessPay(owned)` next to `cleanWavePay`
- edit `src/core/tech.ts` — `buyClaimNode` refuses a node whose `requires` is not owned; fix its doc comment (it currently claims "no prerequisites")
- edit `src/core/profile.ts` — `coinsForRun` gains the flawless term (5th param); `recordRun` passes it
- edit `src/ui/hud/StatsCard.ts` — read the node once (like `cleanPay`) and pass it to `coinsForRun` in `update()`
- edit `src/scenes/PauseScene.ts` — worth line (line 67) passes the 5th arg
- edit `src/scenes/RewardsScene.ts` — claim coins (line 78) and the coin recipe (line 124) get the "flawless +N" term
- edit `src/scenes/TechScene.ts` — claim row maps `requires: n.requires` instead of `null` (line 82)
- edit `tests/core/tech.test.ts`, `tests/core/profile.test.ts` — pin the node, the 85 price, the gated buy and the formula term

### Interfaces
```ts
// content/tech/claim.ts — ClaimNode gains two fields; new function:
flawless: number;               // coins a flawless run pays while this node is owned
requires: string | null;
export function flawlessPay(owned: readonly string[]): number; // 10 when 'flawless' owned, else 0

// core/profile.ts — exact new body:
export function coinsForRun(result: RunResult, cleanPay = 1, mul = 1, levelMul = 1, flawlessPay = 0): number {
  const flawless = result.waves > 0 && result.clean === result.waves ? flawlessPay : 0;
  return Math.floor((result.waves + Math.floor(result.stopped / 10) + result.clean * cleanPay + flawless) * mul * levelMul);
}
```
The term sits **inside** the multiplied sum, next to the clean term (node terms are doubled by Iron and scaled by `levelMul`, same as `cleanPay`). Flawlessness is `waves > 0 && clean === waves` — the run's ledger fields (`wavesCleared` = fully cleared waves, `cleanWaves` = cleared without a leak), so a resumed run needs no new save state.

### Steps
1. `src/content/tech/claim.ts` — replace the file's interface/list and append:
```ts
{ id: 'clean2', name: 'Clean ×2', line: 'each clean wave pays 2 coins instead of 1', price: 30, pay: 2, flawless: 0, requires: null },
{ id: 'flawless', name: 'Flawless', line: 'a flawless run pays 10 coins', price: 30, pay: 0, flawless: 10, requires: 'clean2' },
```
The second node's stored `price` is the branch base (30), like `BOARD_NODES`; the shown and charged price is always `nodeCost(CLAIM_NODES, 'flawless')` = `nodePrice(30, 2)` = **85**. `flawlessPay` mirrors `cleanWavePay`: `const node = CLAIM_NODES.find((n) => owned.includes(n.id)); return node ? node.flawless : 0;`
2. `src/core/tech.ts` — in `buyClaimNode`, after the already-owned check, add `if (node.requires !== null && !profile.purchased.includes(node.requires)) return false;` and update the doc comment (drop "no prerequisites").
3. `src/core/profile.ts` — import `flawlessPay` from `../content/tech/claim`; new `coinsForRun` body as above (update its docstring: "…one per clean wave (two with the claim node), ten for a flawless run (with the Flawless node)…"); in `recordRun` pass `flawlessPay(old.purchased)` as the 5th argument.
4. `src/ui/hud/StatsCard.ts` — import `flawlessPay`; add `private readonly flawlessPay: number;`; in the constructor replace the single `cleanPay` line with `const purchased = loadProfile(window.localStorage).purchased; this.cleanPay = cleanWavePay(purchased); this.flawlessPay = flawlessPay(purchased);` (bare `flawlessPay(...)` is the import; `this.flawlessPay` is the field — same pattern as `cleanPay`); in `update()` append `this.flawlessPay` to the `coinsForRun` call.
5. `src/scenes/PauseScene.ts` — import `flawlessPay`; append `flawlessPay(profile.purchased)` to the `coinsForRun` call at line 67.
6. `src/scenes/RewardsScene.ts` — import `flawlessPay`; after `const cleanPay = …` add `const flawlessCoins = flawlessPay(profile.purchased);`; append `flawlessCoins` to the fallback `coinsForRun` call (line 78); replace line 124 with:
```ts
const coinRecipeParts = [`waves +${this.waves * mul}`, `stopped +${Math.floor(this.stopped / 10) * mul}`, `clean +${this.clean * cleanPay * mul}`];
if (flawless && flawlessCoins > 0) coinRecipeParts.push(`flawless +${flawlessCoins * mul}`);
const coinRecipe = recipe(coinRecipeParts.join(' · '));
```
(`flawless` already exists at line 83; the term shows only when it applies; the existing `recipe()` shrink-to-fit keeps it inside the 360 px card — no new layout code.)
7. `src/scenes/TechScene.ts` — line 82: `requires: null` → `requires: n.requires`. Lock display ("needs the previous", dimmed, disabled button), owned mark (yellow border, "owned"), price and the 2-card narrow grid are all generic — no other scene changes.
8. Tests: `tests/core/tech.test.ts` — replace the "claim row is one node" it (line 129) with `expect(CLAIM_NODES.map((n) => [n.id, n.name, n.price, n.pay, n.flawless, n.requires])).toEqual([['clean2','Clean ×2',30,2,0,null], ['flawless','Flawless',30,0,10,'clean2']])`; add a `flawlessPay` it (`[]`→0, `['clean2']`→0, `['flawless']`→10) next to the `cleanWavePay` it; extend the claim-buy its with `expect(buyClaimNode(withCoins(85), 'flawless')).toBe(false)` (Clean ×2 not owned), `buyClaimNode(withCoins(84, ['clean2']), 'flawless')` → false, and `buyClaimNode(withCoins(85, ['clean2']), 'flawless')` → true with coins 0 and purchased `['clean2','flawless']`; add `expect(nodeCost(CLAIM_NODES, 'flawless')).toBe(85)` to the nodeCost it. `tests/core/profile.test.ts` — add: `coinsForRun({waves:3,stopped:0,clean:3,seed:1,bgen:2}, 1,1,1,10)` → 16; same with `clean:2` → 5 (term drops off); `waves:0` → 0; `coinsForRun({waves:3,stopped:0,clean:3,…}, 2,2,1,10)` → 40 (term doubles like the clean term); and a `recordRun` pair with `purchased: ['flawless']` → 16 vs 6 without.

### Pitfalls
- The `coinsForRun` param and the imported `flawlessPay` share a name — legal (param shadows only inside the function), but in `recordRun` the call `flawlessPay(old.purchased)` must use the import. Don't rename either.
- Do not touch the Flawless star lines (Rewards/Summary/GameOver) — the star stays; only the coin formula and the coin recipe line change.
- Don't hardcode 85 anywhere; price display and charging go through `nodeCost`. Don't grow `TechScene` — one word at line 82.
- Mid-run semantics come free from the ledger: while a leaked wave is still in progress the term can still show; it drops off permanently when that wave ends (clean < waves forever after). This matches "held" = completed.
- StatsCard is fixed-size and PauseScene's worth line already shrinks to fit — the +10 needs no layout work; the recipe line uses the existing `recipe()` shrink (min 13 px), which keeps it within the card at 412x915.
- `tests/core/tech.test.ts` line 130 asserts the exact node list — it will fail until updated in step 8.

### Tests
- `tests/core/tech.test.ts`: node list (id/name/price/pay/flawless/requires), `flawlessPay` ownership, `nodeCost(CLAIM_NODES,'flawless')` = 85, `buyClaimNode` gating (no clean2 / 84 coins refuse, 85 buys).
- `tests/core/profile.test.ts`: the term's presence/drop-off/zero-waves, Iron doubling of the term, and `recordRun` reading the node from the profile (16 with, 6 without).
