---
id: T0313
title: "The claim branch's second node: Flawless pays 10 coins"
size: M
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T00:11:52Z
claimed_at: 2026-10-31T00:11:56Z
epic: E9
designer: desktop
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
