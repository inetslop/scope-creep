---
id: T0113
title: "The burn shows on the enemy: a chip over the burning"
size: S
priority: 3
status: design
depends_on: []
attempts: 0
created: 2026-10-29T09:55:07Z
epic: E4
---

## Goal
A burning enemy (Ember, T0028) shows its burn on itself: a small chip in Ember's orange above the token for as long as the burn is live, so a new player sees who is ablaze — and will keep taking tick damage — without counting hit flashes. The fourth slice of the enemy-telegraph idea (the Mark T0099, the Sprinter T0104 and the Splitter T0105 are in).

## Details
- While an enemy is burning, one small rounded chip in Ember's own orange (the mark tick's chip look, T0099 — the chip language at glyph size, no text) rides above the token, and it clears the instant the burn ends (the 3 s run out, or the enemy dies or leaks).
- A jumped burn (T0059) shows on the enemy it jumps to: any burning enemy wears the chip, jumped burns included (a jumped burn never jumps again, but it is still burning).
- A marked-and-burning enemy wears both chips: the mark's pink stays where it is (T0099) and the burn's orange stacks beside it, no overlap (one small offset — the architect's call — never a second vertical layer above what the mark tick already established).
- Re-ignition (the burn refreshed, T0028) keeps the chip on — it never blips off and back.
- Display only: the burn's rate, duration, re-ignition, jump and source-of-kill attribution are all unchanged; no sound, no input, no pause-screen line.
- A new enemy-hook file on the display-hook pattern (markTick T0099, the sprinter ramp T0104, the splitter crack T0105), registered in the enemy-hooks index — one import and one list line, beside the others. Closest existing thing is the mark tick (T0099): a state chip on an enemy; new is that it is the first chip for a damage-over-time state.

## Acceptance criteria
- [ ] Ember ignites an enemy: a small orange chip appears above the token with the ignition and stays for the burn's full duration.
- [ ] The burn ends (time runs out, or the enemy dies or leaks): the chip is gone the instant it does.
- [ ] A burning enemy dies and its burn jumps (T0059): the chip appears on the enemy the burn jumped to.
- [ ] Re-ignition refreshes the burn without the chip blipping.
- [ ] A marked-and-burning enemy wears both chips (mark's pink, burn's orange) without overlap.
- [ ] Non-burning enemies are byte-identical to today; no sound, no new input.
