---
id: T0243
title: "The draft shows where the card lands: a fit row on every offered card (the T0238 re-file)"
size: L
priority: 2
status: designing
depends_on: [T0236]
attempts: 0
created: 2026-10-30T00:29:56Z
claimed_at: 2026-10-30T00:37:40Z
epic: E4
designer: desktop
---

## Goal
The draft's pick becomes a placement decision: every offered card shows where it would land — the run's towers with a free slot — so "stack this one" vs "branch this one" is seen before the card is taken.

## Details
- Each offered card in the draft (the 3 or 4 of them) wears one extra row under its lines: a small token for every tower in the run with a free slot — the tower's first-augment icon wearing the what-if marker of this offered card (the same compact marker the ghost draws, T0096) — the first 3 towers in build order, then a muted "…". The row is hidden in the pre-wave-1 draft (no towers yet).
- A token is dim (muted, ~50% alpha) exactly where the ghost would be dim for that card on that tower: the row reads the ghost's own dim judge — the rule T0236 lands — the same function, never a second implementation, so the row can never disagree with the board. This task states no other dim rule of its own: where the ghost is live the token is live, where the ghost is dim the token is dim.
- The row is the draft's version of the ghost — the same information on the screen where the pick is made (the ghost is the board's version in the build phase, a different phase, not twice). It is display-only: no input, no sound, the odds line and the reroll untouched.
- The card grows to fit the row (the draft card already grows to its text, T0072); the row must fit at 412x915 (the 2×2 four-card grid) and 1280x720 (one row of cards) with the longest card lines.

## Acceptance criteria
- [ ] In a run with towers, the draft shows one token row per offered card: one token per tower with a free slot (first-augment icon + the card's what-if marker), the first 3 in build order then "…", and no row in the pre-wave-1 draft.
- [ ] For any offered card and any tower with a free slot, the token is live or dim exactly as the ghost marker is when that card is held on that tower in the build phase — the two never disagree.
- [ ] The draft still fits at 412x915 and 1280x720 with the row, including the four-card draft; picking a card, the reroll and the odds line behave as before.
