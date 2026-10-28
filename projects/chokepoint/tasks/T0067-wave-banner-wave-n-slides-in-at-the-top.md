---
id: T0067
title: "Wave banner: 'Wave N' slides in at the top when a wave starts"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-28T13:54:28Z
---

## Goal
The start of a wave is a moment, not a blip: "Wave N" lands at the top of the screen as the wave begins — and this task puts the game's shared top-center slide-and-fade card in place, which the last stand banner (T0060) reuses with its own lines.

## Details
- **When:** the moment a wave starts (the build phase ends and the wave's first spawns are queued), a small white rounded card (~140 px wide, the game's card look with its soft shadow) slides in from above at the top-center of the screen: "Wave N" in bold rounded type, one line, N the wave that just started.
- **Motion:** slides in over ~200 ms, holds ~500 ms, fades out over ~300 ms — ~1 s total. It is transient: it never blocks the board or input, it is never queued (at most one at a time, and a new wave cannot start while one is up), and it is not a control (no pause-screen line).
- **Shared pattern:** this task lands the top-center card and its motion; the last stand banner (T0060) builds on it with its own two lines — no second card system.
- **Position:** top-center, clear of the stats card on both layouts (at 412x915 it sits just under the top HUD row, at 1280x720 it hangs centered from the top edge). The wave preview (T0015) is already gone by wave start, so the two never overlap.
- No sound (the wave-clear sweep stays a separate audio idea), no new key.

## Acceptance criteria
- [ ] At the start of every wave a "Wave N" card slides in at the top-center, holds, and fades out in ~1 s, with the right N.
- [ ] At 412x915 and 1280x720 the card sits top-center clear of the stats card; it blocks no input and takes no taps.
- [ ] Pausing while the banner is up leaves no stuck card — it resumes and fades (or finishes frozen and disappears on resume; never a permanent card).
- [ ] The card is the game's white rounded card (soft shadow, no outline, no gradient); every other HUD element, phase and sound is unchanged.
