---
id: T0272
title: "The early-send teach: the button's banked gold, taught once"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T09:22:16Z
claimed_at: 2026-10-30T09:23:17Z
designer: yoga
---

## Goal
A first-time player sees the big button's "+N" pill but may not know it is gold they can bank: the run's first build phase says, once, that starting the wave early turns the countdown into gold.

## Details
- On the run's first build phase only, one muted line appears under the wave-preview card — the same style, position and one-time pattern as the tag teach line (T0092, in `src/ui/hud/NextWavePreview.ts`) — reading: `start early — the button banks the seconds left as gold`.
- It is derived from the run's state, shown while `run.wavesCleared` is 0 (the build phase before wave 1), and never shown again in that run. A resumed run at wave 1 or later has `wavesCleared ≥ 1`, so it has already "seen" the line and does not show it.
- Wave 1 is never tagged (quiet is every 4th wave, tight from wave 6), so this line never competes with a tag teach line during the first build phase.
- The line fades with the preview card when the build phase ends. No sound, no input, no new card.

## Acceptance criteria
- [ ] The run's first build phase (before wave 1) shows one muted line under the wave-preview card: `start early — the button banks the seconds left as gold`.
- [ ] The line never shows on any later build phase of the same run.
- [ ] A resumed run at wave 1 or later does not show the line.
- [ ] The line fits its card at 412x915 and 1280x720; no sound, no input, and the preview card and button are otherwise unchanged.
