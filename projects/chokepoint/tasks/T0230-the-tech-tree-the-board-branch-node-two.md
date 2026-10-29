---
id: T0230
title: "The tech tree: the board branch, node two — The long way"
size: M
priority: 2
status: design
depends_on: [T0208]
attempts: 0
created: 2026-10-29T21:12:14Z
epic: E2
---

## Goal
E2's last task: the board branch's second node. “One more bend” made new runs windier; “The long way” makes them longer — the branch reads as a choice of island shape, and when it lands the tech tree is done.

## Details
- The tech screen's “The board” row (T0208) gains a second node card after “One more bend”: “The long way” — 30 coins, card text “new runs' roads are 25% longer.” The price display follows T0214's branch discount automatically: with one board node already owned it reads 25 with the 30 struck through; no new price logic.
- States and buying: T0103's four states and T0208's buy flow (affordable bright, unaffordable dimmed with a red price, owned with the yellow border, T0103's pop + chime, the profile's purchased list, survives a reload). No gate: the effect is live the moment it is bought, like “One more bend.”
- The effect (new runs only): a new run's road is 25% longer than today's road for the same seed — the walkable length from entrance to exit, in path cells. The generator's length target is ×1.25 (the architect names the exact parameter in the design, the way T0208 named its); the bend target is unchanged and board size, rocks, entrance, exit generate as today (T0208's words) — the longer road takes its place from the island's open cells. The realized length follows the grid and may land a little above or below 25% per seed.
- In play: more road to cover and more time per enemy — waves, enemy speeds and the build rules are otherwise unchanged.
- Ghost runs (T0078) and resumed runs keep their exact board: the effect flows into the save the way T0208's `bends` field does (written when the run persists, read back on resume, older saves default to off, ghost runs pass off).
- Both board nodes owned: the entrance jog and the longer road compose into one valid board.
- The board branch's done mark (T0215) shows when both nodes are owned — verify it, don't add one.
- Layout: the row now holds two node cards in T0103's node-card look (T0225's column layout keeps their text clear); the existing scroll (T0153) covers the overflow; at 412×915 and 1280×720 every node on every row is visible and buyable.
- Closest examples: “One more bend” (T0208) — the node entry, the buy function, the save field, the generator knob and the tests all follow it; the struck-through price follows T0214's display on the other branches.

## Acceptance criteria
- [ ] The tech screen's “The board” row shows two node cards: “One more bend” (30) and “The long way” (30 — shown as 25 with the 30 struck through once one board node is owned, T0214).
- [ ] Buying “The long way” pays its price with T0103's pop + chime, shows the owned (yellow border) state and survives a reload; with fewer coins it dims with a red price and a tap does nothing.
- [ ] A unit test (at least 5 seeds × both board orientations, owned vs. not owned): every owned road is strictly longer than its unowned twin, the mean length ratio (owned ÷ unowned) over the seeds is between 1.2 and 1.4, and both roads are valid boards (size, entrance/exit on the edge, contiguous walkable path, no self-crossing).
- [ ] With the node not owned, every generated board is byte-identical to today on every seed, with or without “One more bend” owned.
- [ ] A resumed run with the node owned regenerates its exact longer board (save round-trip; a save without the field loads as off); a ghost run of a saved board replays it unchanged.
- [ ] With both board nodes owned, every test seed produces a valid board (the entrance jog and the longer road compose).
- [ ] At 412×915 and 1280×720 every node on every row is visible and buyable; with both board nodes owned the branch's done mark (T0215) shows.
