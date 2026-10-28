---
id: T0076
title: "Flawless: every held wave clean gets the star"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-28T21:24:45Z
epic: E1
---

## Goal
The perfect run is named where it is claimed: a run that held every one of its completed waves clean earns a "Flawless" mark on the claim card and the game-over card.

## Details
- **The rule:** Flawless = every wave the run completed was clean — the run ledger's clean count equals its waves-held count, and the run completed at least one wave. The death wave (the one that takes the last life) is not a held wave and never counts against it. A life the clean streak (T0045) pays back is not a leak; a run that lost a life and won it back is not flawless if it leaked on a held wave — the rule is the waves, not the lives. Read the same values the claim card's count-up already reads (T0003/T0033); never recompute.
- **On the claim card** (`src/scenes/RewardsScene.ts`): a "Flawless" line under the Board line (T0056) — the small yellow star (the T0016 star, same size and yellow) beside the word "Flawless" in muted ink. Shown with the card (no count-up, no sound).
- **On the game-over card** (the GameOver scene's card, the one the flow shows before the claim card): the same small yellow star beside the score line, the moment the run ends flawless.
- A run that is not flawless shows both cards exactly as today (byte-identical). No coin change: the formula is untouched (the recipe line T0075 explains it).
- Closest example: the profile card's best-wave star (T0016) for the star, and the Board line (T0056) for the placement.

## Acceptance criteria
- [ ] A run that ends having held every completed wave clean (at least one held) shows "Flawless" — yellow star plus muted word — under the Board line on the claim card, and the small yellow star beside the score on the game-over card.
- [ ] A run that leaked on any held wave shows both cards exactly as today; a run that died on wave 1 (no held waves) is not flawless; a run that held wave 1 clean and died on wave 2 is.
- [ ] The coins, the recipe line (T0075), the score and the best-wave star are unchanged by this mark.
- [ ] The card fits 1280x720 and 412x915 with the new line.
- [ ] `npm run check` and `npm run smoke` pass on desktop and mobile.
