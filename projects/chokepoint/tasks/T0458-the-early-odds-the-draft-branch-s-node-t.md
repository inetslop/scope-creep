---
id: T0458
title: "The early odds: the draft branch's node that starts the odds shift at wave 1"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-03T01:13:05Z
claimed_at: 2026-11-03T01:41:12Z
epic: E23
designer: desktop
---

## Goal
Between-run coins buy how the run's cards come: the tech tree's existing "The draft" branch gains a fourth node that, once owned, makes the draft's tier-odds shift — the one that brings rarer cards up more often as a run deepens (T0011) — start from the very first draft instead of wave 5.

## Details
- A node on an existing branch, not a new row (T0450 was rejected for framing it as a new eighth row): the tech screen's "The draft" row — the 2nd row, home of the two Slot II −5 nodes and Fourth card — shows one more node card after its current ones: **The early odds**, 80 coins (the branch's depth-4 price: base 10 — 30 at depth 2, 80 at depth 4), dry one-liner "the odds shift starts at wave 1, not wave 5". It buys with between-run coins and wears the owned mark exactly like the branch's other nodes; it buys independently of them (no gate — the branch's existing rule). The run-start row already carries five nodes, so a four-node row needs no layout change.
- The effect (on for every run started after the buy, carried in the run's tech state like the branch's other nodes): the tier-odds shift (`tierOdds` in core/tiers.ts, T0011) starts at wave 1 instead of wave 5 — every draft rolls at the odds today's curve gives the same draft four waves later. The first draft (before wave 1) already shows shifted odds, above the flat 70/25/5, and the caps land four waves earlier: Rare 33% at wave 8 (not 12), Epic 15% at wave 10 (not 14); Common is the remainder.
- The draft's own odds line shows the shifted numbers; nothing else changes: the card count, the no-repeat rule, the reroll, the opening Common Bolt floor and the cards' looks.
- A run without the node rolls exactly today's odds: flat 70/25/5 until the shift starts at wave 5 (+1/wave to Rare and Epic, caps 33 and 15 at waves 12 and 14).

## Acceptance criteria
- [ ] The tech screen's "The draft" row shows The early odds as its fourth node — 80 coins, the one-liner, the branch's node look; buying it spends between-run coins and it wears the owned mark; no new row, no other layout change.
- [ ] In a run started after the buy, the first draft (before wave 1) already shows tier odds above the flat 70/25/5, and each later draft's odds match today's curve four waves ahead — the Rare 33% cap at wave 8, the Epic 15% cap at wave 10.
- [ ] In a run without the node the odds are exactly today's: flat 70/25/5 until the wave-5 shift (+1/wave, caps 33 at wave 12 and 15 at wave 14).
- [ ] The draft offer is otherwise unchanged: same card count, no-repeat rule, reroll and opening Bolt floor.
