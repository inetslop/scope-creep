---
id: T0236
title: "The what-if says nothing: a dead added form dims its ghost marker"
size: S
priority: 2
status: failed
depends_on: []
attempts: 0
created: 2026-10-29T23:34:09Z
claimed_at: 2026-10-29T23:54:20Z
finished_at: 2026-10-30T00:37:57Z
epic: E4
design_attempts: 1
---

## Goal
The what-if preview (T0096) never lies: when a held card's added form does nothing to a tower, its ghost marker shows that instead of promising an effect that never fires.

## Details
- The what-if (T0096): while a hand card is selected, a tower with a free slot shows, at half alpha on its next free slot, the tier pip and a compact marker of what the card would add. Today the marker is drawn as live for every card on every such tower.
- Some added forms do nothing on some towers: the "hits do X" family (Frost's slow, Anchor's root, Ember's burn, Push's push, Mark's mark) on a tower whose first form never hits — a pure Mint, a pure Rally, a pure Mark — is applied by no attack the tower has. The marker promises it anyway; placing the card changes nothing.
- Change: the marker is drawn dimmed — 25% alpha, unfilled (the tier pip beside it keeps its tier color exactly as today) — whenever the card's added form does not change the tower's effective spec. The judge is the tower's own spec, the same code that computes the tower's attack when the card is actually placed: live when the spec (the fields that drive the attack or its economy) actually changes, dimmed when it does not. Compute it as a structural compare of the tower's spec before and after adding the card — one source of truth, so the ghost can never disagree with placement and no display-only table of augment pairs is kept.
- A small pure helper for that compare, exported so a unit test can call it (a new tiny core module, or exported from the ghost's file — the architect's choice).
- Scope: the what-if display only. `src/systems/towerGhost.ts` (T0096's file) is the one display file; placement, the spec, the draft scene, the hand and the tower panel are untouched. No new text on the board, no sound, no input — the dimming is the whole signal.
- Closest example: T0096 (the ghost this changes) and T0135 (a look-only change with everything else byte-identical).

## Acceptance criteria
- [ ] Holding a Frost card (any tier) over a pure Mint tower: the ghost on its free slot shows the tier pip as today and the marker dimmed at ~25% alpha; committing the card there leaves the tower's attack unchanged (a second look: nothing new fires).
- [ ] The same Frost card over a Bolt tower: the marker is live (half alpha, as today), and the committed tower's hits slow enemies.
- [ ] The same check holds for Anchor, Ember, Push and Mark cards on a pure Mint or pure Rally, and for Rapid/Reach (pure number changes) on any tower with a free slot: live, as today.
- [ ] A build phase with no card selected is byte-identical to today; the draft scene, hand and tower panel are unchanged; the pause screen's controls list is unchanged (no new key or button).
- [ ] Unit test calls the compare helper on a live and a dead card+tower pair; 412x915 and 1280x720 render the ghost as today (no new element to fit).

## Rejected by architect (cachyos-x8664)

A pure Mint tower is a damage-0 pulse (not a never-hit tower), so adding Frost makes it newly fire and change its spec — the premise that the hits-do-X family is "applied by no attack" there is false, and the AC "nothing new fires" is contradicted; the dim/judge rule is built on a wrong fact.
