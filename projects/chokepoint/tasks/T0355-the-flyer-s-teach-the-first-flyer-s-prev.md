---
id: T0355
title: "The Flyer's teach: the first Flyer's preview says it crosses the sky"
size: S
priority: 2
status: designing
depends_on: [T0353]
attempts: 0
created: 2026-11-01T11:14:54Z
claimed_at: 2026-11-01T11:42:14Z
epic: E10
designer: cachyos-x8664
---

## Goal
The first time a Flyer's token shows in the next-wave preview, one muted line under it names the new read — it crosses the sky — so the cover of the island is chosen in the build, not learned at the crossing's door.

## Details
- The early-send teach's pattern (T0272: one muted line under the wave preview, once per run, re-derived on resume): in the first build phase whose next wave contains a Flyer, one muted line under the next-wave preview reads "the Flyer crosses the sky — cover the island, not just the road" and shows for that build phase only.
- Once per run: the flag rides the run state and the run save like the other one-time teaches (T0272's, T0307's), so a resumed run past that moment never shows the line, and a resumed run before it shows the line at the first Flyer wave as if it had not been seen.
- The line says what the preview's token does; the preview keeps showing the token and the count, and nothing on the board changes (the spawn ring in T0353 is the on-board tell). No sound, no chip on the board.
- The line fits the preview card at 412x915 and 1280x720 with the longest preview contents showing at once.

## Acceptance criteria
- [ ] on the first build phase whose next wave contains a Flyer, one muted line under the preview reads "the Flyer crosses the sky — cover the island, not just the road"; the next build phase, Flyer or not, shows no line
- [ ] after a resume past that moment the line never shows; a resume before it shows the line at the first Flyer wave
- [ ] the preview's tokens, counts and bonus line, and everything on the board, are unchanged
