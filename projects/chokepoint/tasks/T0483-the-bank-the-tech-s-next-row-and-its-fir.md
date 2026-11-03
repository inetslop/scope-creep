---
id: T0483
title: "The bank: the tech's next row and its first node, The deep vault"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-03T08:53:31Z
claimed_at: 2026-11-03T09:29:31Z
epic: E29
designer: desktop
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
