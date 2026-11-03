---
id: T0462
title: "Opening wild: the draft branch's node that gives the first draft a Rare or better"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-03T02:05:22Z
epic: E23
---

## Goal
Between-run coins buy how the run's cards come: the tech tree's existing "The draft" branch gains its sixth node, which once owned gives every run's first draft a Rare or better card alongside its Common Bolt floor (T0048) — the run's opening build starts a tier higher.

## Details
- A node on the existing branch, not a new row: the tech screen's "The draft" row — the 2nd row, home of the two Slot II −5 nodes, Fourth card, The early odds (T0458) and A cheaper roll (T0459) — shows one more node card at the end: **Opening wild**, the branch's sixth node, depth 6: 145 coins by the branch's own depth rule (base 10 — the row's prices read 10, 30, 50, 80, 110, 145). The node is appended last in the row's data, after A cheaper roll — the row's order is its depth (inserting it earlier re-prices the nodes ahead of it, T0458's trap). Bought once, on for every run after, bought independently of the row's other nodes (no gate — the branch's existing rule).
- The effect (on for every run started after the buy): every offer the pre-wave-1 draft presents — the first one and its rerolls — carries a Rare floor on one card: the slot right after the Common Bolt's slot (T0048) rolls its tier as usual but never comes out Common; a rolled Common reads as Rare. The opening offer is therefore always: the Common Bolt, one card that is Rare or better (Epic at the roll's own odds), and one card at the normal odds. The augment in the floored slot is still rolled from the same pool by the same rules — the floor changes the tier only.
- With The early odds owned (T0458), the floored slot rolls at the shifted odds and still floors at Rare; without it, at the flat 70/25/5.
- The opening draft is the only draft a run ever rolls before a save exists: a resumed run picks up at the build or wave phase, never at the opening draft. The effect is confined to run start and needs no mid-run state — no field on the run, nothing in the run save; a resumed run can neither gain it nor lose it.
- The node's card wears the row's own card language: the name "Opening wild", a dry one-liner naming the floor ("the first draft always offers a Rare or better"), the 145 price, the owned mark once bought. The row's existing five nodes and the rest of the tech screen are untouched; the row lays out the sixth card the way the run-start row lays out its five (two per grid row in narrow mode).
- The offer's rest is unchanged: the card count, the no-repeat rule, the reroll, the odds line (it names the other slots' roll), the tier chime and the Epic frame shimmer — the floored card still reveals, chimes and shimmers as its rolled tier.

## Acceptance criteria
- [ ] The tech screen's "The draft" row shows Opening wild as its sixth node — 145 coins by the branch's depth rule, the one-liner, the branch's node look; buying it spends between-run coins and it wears the owned mark; the six-card row fits at 412x915 and 1280x720.
- [ ] In a run started after the buy, every pre-wave-1 offer (the first and its rerolls) carries a Rare-or-better card in the slot right after the Common Bolt's: a rolled Common in that slot reads as Rare, a rolled Epic stays Epic; the other non-Bolt slot rolls at the normal odds.
- [ ] With The early odds owned, the floored slot rolls at the shifted odds and floors at Rare; the opening offer composes with it otherwise unchanged.
- [ ] In a run without the node, the opening offer is exactly today's: the Common Bolt plus two cards at the flat 70/25/5 (or the shifted odds with The early odds owned).
- [ ] Drafts from wave 1 on are byte-identical with and without the node.
- [ ] No run-save state is added for the node: a resumed run never rolls the opening draft, so the node cannot activate mid-run or after a resume.
- [ ] The floored card reveals, chimes and shimmers as its rolled tier; the odds line, card count, no-repeat rule and the opening Bolt floor are untouched.
- [ ] Unit tests cover the depth-6 price of 145, the buy/owned state, the opening offer with and without the node (Common in the floored slot reads Rare, Epic passes through), and the composition with The early odds.
