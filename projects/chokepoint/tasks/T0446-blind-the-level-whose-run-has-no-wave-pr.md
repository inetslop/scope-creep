---
id: T0446
title: "Blind: the level whose run has no wave preview"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-02T21:47:49Z
claimed_at: 2026-11-02T22:25:22Z
epic: E21
design_attempts: 1
designer: cachyos-x8664
---

## Goal
The run-setup step's level set (Crowded, Lean, Short fuse, Swift, Tough) gains a sixth level, Blind: a run with no wave preview — the build phase plans without knowing what the wave sends, and the run's coin multiplier pays for the handicap. The first of the set's growth past the five (E21): the run the player sets up is a pick.

## Details
- Blind joins the level set on the set's own terms: the same slots on the run-setup step (the daily-board pick's screen, after Play), the same multiplier stack, the same white chip (name only) on the LevelChips row while it is on.
- Blind's multiplier: one notch above the set's current top, on the set's own scale (the five's multipliers are in the level data; take the scale's next step). No new readout: the menu's number before the run, the coin tally and the pause's worth line already carry the multiplier.
- Blind's one-liner on the run-setup step, in the set's dry voice: "no preview of the next wave."
- While a run has Blind, the next-wave preview card (the build-phase card above the next-wave button) never appears: no tokens, no counts, no tag chip, no one-time teach line — the boss's token rides the card too, so a boss wave is a surprise until it starts (the banner and the boss card still announce it at wave start).
- The flyer's build-phase line (the seeded crossing shown before a Flyer boss wave) stays hidden too — it is the preview's own information.
- What Blind does not touch: the wave banner and its tag chip at wave start (a tag is still seen where the wave lands), the next-wave button's live enemy count during the wave, the boss card while a boss is alive, the exit warning, the early send and its countdown gold, the draft and its cards, the wave reference.
- A resumed run keeps Blind: the run save carries the run's levels, so a resumed blind run is still blind.
- A run without Blind is byte-identical: the preview card, the flyer's line and the coin multiplier are all as they are.

## Acceptance criteria
- [ ] The run-setup step lists Blind next to the five, with its one-liner, and a run can start with it; a run without it is unchanged.
- [ ] A Blind run: the next-wave preview card never appears during any build phase, and the flyer's build-phase line never appears before a Flyer boss wave.
- [ ] A Blind run: the wave banner still wears its tag chip at wave start, the next-wave button still counts the wave's enemies during the wave, and the boss card still shows while a boss is alive.
- [ ] Blind's multiplier is one notch above the set's current top on the set's own scale; it shows on the menu's number before the run and rides on the coin tally and the pause's worth line, with no new readout.
- [ ] A resumed Blind run is still Blind at its resumed build phase.
- [ ] The LevelChips row shows Blind's chip (name only) while it is on.
- [ ] A run without Blind is byte-identical: the preview card, the flyer's line and the coin multiplier are unchanged.
