---
id: T0130
title: Boss count-in — the page counts the boss in
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T17:13:57Z
claimed_at: 2026-10-27T17:14:48Z
designer: yoga
---

## Goal
The 5 s pre-boss warning (T0070) counts down in the existing low thud — one on each of the last four whole seconds — so a sharp ear feels the boss landing on the beat, not just seeing the red pulse.

## Details
- The warning already plays one low thud at its start (T0070, 5 s before the boss lands). Add the same thud once on each of the 4 whole seconds before the boss lands — at 4.0 s, 3.0 s, 2.0 s and 1.0 s out — 1 s apart, so a steady once-per-second pulse leads into the spawn sting (T0058), which lands where the next thud would have.
- Reuse the warning's existing low thud — no new tone, no new SFX method argument; it is mute-gated like all SFX and plays nothing while the game is paused (the run clock pauses).
- One pulse train per warning, including respawns (which already re-warn via T0070). Nothing changes about the warning's red boundary pulse, the "SOMETHING HEAVY APPROACHES" flash, or its 5 s length.

## Acceptance criteria
- [ ] During any boss warning (The Frame, The Grid, The Palette, The Press, and every respawn), the low thud plays 5 times — once at the warning's start exactly as today, then once on each of the 4 whole seconds before the boss lands, 1 s apart.
- [ ] No new SFX tone is added; the thuds honor the existing mute and none plays while paused.
- [ ] The warning's visuals (boundary pulse, flash) and its 5 s length are unchanged, and no other system's audio or timing is touched.
