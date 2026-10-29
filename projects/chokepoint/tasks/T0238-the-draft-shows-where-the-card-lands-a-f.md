---
id: T0238
title: "The draft shows where the card lands: a fit row on every offered card"
size: L
priority: 2
status: failed
depends_on: []
attempts: 0
created: 2026-10-29T23:34:09Z
claimed_at: 2026-10-29T23:34:23Z
finished_at: 2026-10-29T23:54:17Z
epic: E4
design_attempts: 1
---

## Goal
E4's goal is that the draft is the run's core decision — but today the pick is made blind to the run: each offered card says what it does in the abstract. The fit row says, on the card itself, what each offered card would make of the towers the player already has.

## Details
- Where: the draft scene (T0024's cards). Every offered card grows one row at the bottom (T0072's rule — the card grows to fit its text; the row joins the name line, the first line and the added line).
- What the row is: one small token per tower in the run that has a free slot — the tower's first-augment icon at 12 px (the codex's icon scale) wearing the what-if marker (T0096's compact marker language — the same capsule/rod/bulb the ghost uses) at 50% of the ghost's size, small gaps between. Up to 3 tokens, then a muted "…". Order: the towers' board order (the order they were placed).
- Live vs dimmed: a token is dimmed (25% alpha, no marker) when the card's added form does nothing to that tower. The judge is the same rule T0236 states — a structural compare of the tower's spec before and after the card is added, live only when the spec actually changes — computed in this task's own pure module, so the row and the ghost give the same verdict for the same card and tower and neither display can drift.
- When it shows: only while the run has at least one tower with a free slot — hidden in the pre-wave-1 draft (there are no towers yet), present from the second draft on. It is part of the card from the start, so the reveal flip (T0024) and the reroll re-flip (T0036) carry it with no mid-flip reflow.
- What it does not show: the "start a new tower" option — a new tower can take any card as its first, so there is nothing to list (the card's first line is already the new-tower form); no tier (the name line has it); no counts (3 tokens + "…" is the whole row).
- Why the screen has room (one in, one out): the draft card is the decision surface and the row answers the one question the card currently can't — "what does this make of what I have?" — which is exactly what the build-phase what-if (T0096) answers after the pick is already committed. It replaces nothing; it takes the card's own growth room.
- Files: `game/src/scenes/DraftScene.ts` (the card's new row), a new pure module for the row's data (which towers, which markers, which are dimmed), the ghost's marker painter reused at the small scale. No run-rule change, no new input (a pick is still one tap), the build-phase what-if (T0096) untouched.
- Closest example: T0072 (the card growing to fit a new line) and T0096 (the marker language).

## Acceptance criteria
- [ ] A run with at least one tower holding a free slot opens a draft: every offered card shows the fit row — one token per such tower (first-augment icon + what-if marker), up to 3 tokens then a muted "…", in board order.
- [ ] A Frost (or Anchor/Ember/Push/Mark) card: its token is dimmed on a pure Mint or pure Rally tower and live on a Bolt tower — the same verdict the ghost (T0236's rule) gives for the same card held over the same tower.
- [ ] The pre-wave-1 draft of a fresh run shows no fit row; from the second draft on (after the first build placed towers) it does.
- [ ] A pick is still one tap: the reveal flip, the tier chime, the reveal shimmer, the reroll and the four-card draft (T0065) behave exactly as today; no new key or button, so the pause screen's controls list is unchanged.
- [ ] 412x915 and 1280x720: the four-card draft shows every row with the longest token row, all text inside its card at the card's current scale.
- [ ] The build phase (the ghost) and every scene but the draft are byte-identical to today.

## Rejected by architect (cachyos-x8664)

The fit row's dimmed/live verdict is delegated to T0236's judge ("the same rule T0236 states"), which has no code yet, and this task's only restatement of it — "a structural compare of the tower's spec before and after the card is added, live only when the spec actually changes" — contradicts its own acceptance example: adding a Frost/Anchor/Ember/Push/Mark card to a pure Mint or pure Rally tower sets a spec field (slow/root/burn/pushPerHit/markPct) that is empty in a pure tower, so a structural compare is LIVE, not the required DIMMED.
