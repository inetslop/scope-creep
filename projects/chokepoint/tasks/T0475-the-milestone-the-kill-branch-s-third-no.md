---
id: T0475
title: "The milestone: the kill branch's third node, the chain's milestone pay ×2"
size: M
priority: 2
status: design
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
