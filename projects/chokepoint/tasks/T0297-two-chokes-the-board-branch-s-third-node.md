---
id: T0297
title: "Two chokes: the board branch's third node"
size: M
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T17:56:06Z
claimed_at: 2026-10-30T18:19:02Z
epic: E9
designer: desktop
---

## Goal
E9's bigger payout needs a sink: the tech tree's board branch — today two nodes, One more bend and The long way — gets its third node, "Two chokes", which makes every generated board carry two of T0217's guaranteed choke cells instead of one: a permanent board upgrade priced like a full run's coins, at the bottom of the branch.

## Details
- **The node:** the third row of the board branch in the Tech scene, in the branch's existing card pattern (name, plain line, price line, owned mark). Name "Two chokes", line "two double-cover cells instead of one". Stored price 30 (the branch's base, like its siblings); the price line shows the branch's current rule — today 20 under the branch discount (T0214), and 155 (round5(30 × 3^1.5)) once T0288's depth price lands. No special-casing in this task.
- **What the player sees differently:** the generated road folds back on itself twice — two cells where the road passes close twice, each double-covered by a tower placed on it (today's one guaranteed choke, T0217, becomes two) — so a run can build two over-covered points instead of one, or choose between them; the board gets a second real placement decision. The cells look exactly like today's choke (no new mark, no new paint).
- **The rule:** while the node is owned, every board the game grows — a new run, a ghost run's re-grow, a resumed run's board — carries two choke cells; on a standard board (14×8 / 8×14) the generator places two for every seed, under its existing feasibility guards (a board never fails to generate; if a particular road truly cannot fold twice it keeps one — the tests must not hit that case on standard boards). Without the node, boards are byte-identical to today.
- **The wiring:** the choke count flows from the owned nodes to the board generator the same way the branch's bends (T0208's boardBends) and length (T0230's lengthMul) already flow; the menu's live demo grows its board from the owned board nodes exactly as it does today (unchanged by this task); the Tech button's dot (T0213) and the Tech scene's affordability pick the node up automatically.
- **Nothing new on screen** besides the node's row.

## Acceptance criteria
- [ ] The Tech scene's board branch shows three rows; the third reads "Two chokes" over "two double-cover cells instead of one" with the branch-rule price, buys, and shows the owned mark once bought.
- [ ] Unit tests: with the node owned, a standard board generated from at least three different seeds carries two choke cells; without the node, one (asserted on the generator's choke output, not pixels).
- [ ] A new run's board, a ghost run's re-grow and a resumed run's board all carry two choke cells when the node is owned; without it, every board is byte-identical to today.
- [ ] The menu demo's board growth is unchanged; the Tech dot (T0213) appears when the node is the only affordable unowned node.
- [ ] The new row fits at 412×915 and 1280×720 (the layout check, T0226); npm run check and the desktop/mobile smoke pass.
