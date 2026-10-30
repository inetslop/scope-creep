---
id: T0298
title: "The wildcard: the 4th card becomes whatever you pick, always Rare or better"
size: L
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-30T18:18:58Z
epic: E4
---

## Goal
The draft gets a card that is sometimes something special: in every 4-card draft the 4th card is a Wildcard — a card that becomes the augment the player picks, always at least Rare.

## Details
- In every 5th draft (5, 10, 15, … — the drafts T0065 makes 4-card) the 4th card is a Wildcard: not one of the 16 pool augments, the 4th slot itself. It flips in last like the 4th card does today, but face-up with a muted gray frame, a large muted-ink "?" in the center, and a muted "Always Rare or better" line where the tier line would be. No tier chime on its flip (it has no tier yet) and no where-it-lands row (T0243) on its card.
- A reroll (T0036/T0276) re-rolls the three rolled cards and keeps the Wildcard as the 4th. The pre-wave-1 draft stays 3-card (T0048's Bolt floor untouched); the no-repeat rule (T0052) applies to the three rolled cards.
- Picked, the Wildcard sits in the hand as a white card with the muted gray frame, the "?" in the name-line position, no gem row, no owned dot, no ×N count. It holds alongside other hand cards; each Wildcard card resolves on its own.
- Tapping a Wildcard in the hand (the same tap path as any hand card) opens the chooser instead of selecting it for placement: a centered white card over the dimmed board (the draft's dim) listing every pool augment whose gate, if it has one, is open — the same set the draft can offer, Haste's node lock and later locks (the T0248 lock rule) absent — as small cards in the codex card's look (T0221): icon, name, the codex card's own line. Grid of 4 columns (≤4 rows) at 1280x720, 3 columns at 412x915.
- Tapping an augment in the chooser resolves the hand card into it. Its tier rolls with the draft's current odds (T0011's tierOdds at the run's wave) with a floor of Rare (a Common roll becomes Rare). The card takes the rolled tier's frame, gem row and tier word (T0008/T0026), does a small ~200 ms flip-in (T0024's shape) and plays the tier chime at the resolved tier (T0032). From then it is an ordinary hand card: selecting it, the what-if preview (T0096) with its full ring preview, and the build-commit tier chime (T0088) all work as usual.
- Unresolved, a held Wildcard's what-if (T0096) shows only the "?" marker on towers with a free slot at half alpha — no range ring, no stats line (its effect is unknown).
- Tapping outside the grid closes the chooser; the Wildcard stays in the hand, still unresolved. No new key (so nothing to list on the pause screen).
- Teach: the run's first 4-card draft shows one muted line under the cards (T0092's teach pattern): "The 4th card is a Wildcard — pick it and choose what it becomes. Always Rare or better." Shown when a run first opens a 4-card draft; a resumed run that already opened one (past draft 5) never shows it.
- Save: an unresolved Wildcard stores in the hand as its own marker and restores as the "?" card; a resolved one stores as the plain augment it became. A resumed chooser lists the same ungated pool.
- It is not an augment: no codex entry, no pool registration (the 16-cap untouched), no card lines, no tower look.

## Acceptance criteria
- [ ] In a fresh run the draft after wave 4 (the first 4-card draft) offers three rolled cards plus a 4th that flips in last: white card, muted gray frame, "?" in the center, "Always Rare or better" beneath.
- [ ] Picking it and tapping it in the build phase opens the chooser: a centered white card over the dimmed board with one small codex-look card per ungated pool augment (gated ones absent while their node is unowned), the grid fitting at 1280x720 and 412x915.
- [ ] Tapping an augment in the chooser resolves the hand card into it: frame, gem row and tier word wear the rolled tier (a Common roll shows Rare), with the tier chime and the ~200 ms flip-in; the card then places like any other card (what-if ring, build-commit chime, tier pips and the augment's look on the tower).
- [ ] Tapping outside the chooser closes it and the Wildcard stays in the hand; while unresolved its what-if shows only the "?" marker on free-slot towers (no ring).
- [ ] A reroll in a 4-card draft re-rolls the three rolled cards and keeps the 4th as the Wildcard; the pre-wave-1 draft is still 3-card with the Bolt floor.
- [ ] The run's first 4-card draft shows the muted teach line under the cards; later 4-card drafts and a resumed run past draft 5 do not.
- [ ] Closing the tab with an unresolved Wildcard in the hand and resuming restores the "?" card, which resolves the same way.
- [ ] The codex is unchanged (no Wildcard entry) and the draft pool still lists the same 16 augments.
