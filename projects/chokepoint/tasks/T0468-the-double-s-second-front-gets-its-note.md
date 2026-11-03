---
id: T0468
title: "The double's second front gets its note"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-03T03:26:12Z
epic: E22
---

## Goal
The double tag (T0447) is two fronts with a 6 s lull between them, and the second front walks in faster (1.2×). The lull is the tag's tactical heart — a beat of quiet, then a quicker wave. The player should hear that turn, so the second front is never a surprise.

## Details
- When a double-tagged wave's second front begins — the exact moment its 6 s lull ends and the faster front starts to walk in — play one quiet note, once per double wave.
- The note is a soft two-note rise (the tower-milestone note's own class, T0464: two short sines ~30 ms apart, rising), at the tag-note's own volume (T0457's level, never above the hit blip). It is the audio twin of the banner note: the banner note (T0457) still plays at the wave's start for the first front; this one plays 6 s later for the second.
- It plays on every platform and is silent with the pause's Sound toggle off (Sfx's existing mute check).
- It is audio only: no new HUD, no chip, no haptic (the double's own haptic, T0449, stays at the banner).
- The closest examples to copy are the tag note (T0457) and the tower-milestone note (T0464): one small new module that plays the note, plus one new method in `src/audio/Sfx.ts`. The double tag's schedule lives in `core/waves.ts` (the T0447 tag); hook the note to the second front's start there.
- Everything else is byte-identical: the quiet breather and every other tag, and the banner note and haptic, are untouched.

## Acceptance criteria
- [ ] A double-tagged wave plays one quiet two-note rise the moment its 6 s lull ends and its second front starts; it plays once per double wave.
- [ ] The note plays on every platform and is silent with Sound off.
- [ ] The banner note (T0457) and the double's haptic (T0449) are unchanged, and no other tag, wave or sound changes.
- [ ] No new HUD element, chip or haptic.
