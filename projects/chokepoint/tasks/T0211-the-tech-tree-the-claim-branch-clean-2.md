---
id: T0211
title: "The tech tree: the claim branch — Clean ×2"
size: L
priority: 2
status: design
depends_on: [T0153]
attempts: 0
created: 2026-10-29T15:15:13Z
epic: E2
---

## Goal
The tech tree grows a fifth branch, “The claim”, whose nodes change what a run pays: the first node, “Clean ×2”, makes each clean wave pay 2 coins instead of 1 — so holding the line cleanly is worth coins across runs, not only the in-run streak life and Momentum's damage bonus.

## Details
- The tech screen (T0103) gains a fifth branch row, “The claim”, with one node card: “Clean ×2” — 30 coins — card line: “each clean wave pays 2 coins instead of 1.” T0153's row and card look, and T0103's states (affordable bright, unaffordable dimmed with a red price, owned with the yellow border). No gate state — unlike the pool nodes, the effect is in the game the moment the node is bought.
- The row is appended at the end of the rows list (after the pool row; the board branch's row, T0208, lands beside it in either order).
- The effect: the clean term of the run's coin formula (T0001's `coinsForRun` in core/profile.ts — waves + floor(stopped/10) + clean) doubles: each clean wave pays 2 coins instead of 1, for the whole run, from the first clean wave on. The formula stays one pure function; the node's owned state (from the profile's purchased list, node id `clean2`) is read where the formula is applied — the way the other branches' effects are read. The node id is free (there is no augment to match); `clean2` keeps it short.
- Every readout of the run's coins reads that one formula, so all of them show the change with no per-scene logic: the live “+N coins” tally in the stats card (T0013), the pause card's “worth +N coins” line (T0087) and the claim card's count-up with its recipe line (T0047, T0075) — with the node owned, the recipe's clean term reads 2× the run's clean count.
- A run without the node (a first-time player) is byte-identical: same formula, same three readouts, same recipe line as today.
- Buying: 30 coins, T0103's balance pop + two-note chime, the owned state, saved to the profile's purchased list — a buy is permanent and survives a reload.
- This task owns the branch, the node and the formula's clean term. It does not touch the in-run clean chip (T0005), the clean streak (T0045) or Momentum's clean-wave bonus (T0064) — “a clean wave” keeps exactly today's meaning (zero leaks, the same wave those three use).

## Acceptance criteria
- [ ] The tech screen shows a fifth row “The claim” with one node card “Clean ×2” priced 30, T0103's card look; at 412×915 and 1280×720 the row is visible and the node is buyable (the scroll cue behaving as today).
- [ ] Buying it pays 30 coins with T0103's pop + chime, shows the owned (yellow border) state and survives a reload; the run-start, draft, pool and board rows and their states are untouched.
- [ ] A run with the node owned: each clean wave adds 2 to the run's coin tally — the live tally, the pause worth line and the claim card all agree — and the claim card's recipe line reads the doubled clean term (e.g. 3 clean waves → “clean +6”).
- [ ] A run without the node is byte-identical: the formula, the three readouts and the recipe line read exactly as today (1 clean wave → “clean +1”).
- [ ] Unit tests: the formula with and without the node (clean counts 0, 1, 4 → clean terms 0/1/4 vs 0/2/8, the other terms unchanged); the node purchase (unknown id / already owned / 29 coins → refused, coins unchanged; success deducts exactly 30 and saves `clean2` in the purchased list); the branch's content row maps to the single node.
