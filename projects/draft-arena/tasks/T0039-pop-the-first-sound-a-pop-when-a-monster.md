---
id: T0039
title: "Pop: the first sound, a pop when a monster dies, pitched by its size"
size: M
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-10-31T07:44:39Z
epic: E11
---

## Goal
The field is silent. Give it its first sound: when a monster pops it makes a short pop, and a big one pops deeper than a small one. This is also where the game's audio starts, so every sound after it (chime, coin, more) builds on the same little layer.

## Details
- A short "pop" plays the moment any monster dies (Dot, Puff, Snail, Spitter, Zippy, and Flee and Boing as they land). It is a candy pop, not a gun or an explosion: a soft blip that snaps, like a bubble.
- Pitch follows size: a small monster (a Dot) pops high, a big one (a Puff and anything bigger) pops lower. The ear reads the crowd the way the eyes already do.
- One pop per monster that dies. A Puff that pops into three Dots plays one pop, not four.
- A crowd of ten dying at once must not turn into a buzz: overlapping pops are capped/throttled so the mix stays clean.
- Quiet by default: the pop sits under the action, not over it, and is short (under about 0.15 s).
- No sound before the match is underway. On phones the audio starts on the first user gesture (tapping Play), so there is no silent-autoplay problem, and nothing blocks the touch controls.
- No engine change: the sound is a small audio layer the developer adds on top, triggered by a monster that is already dying. The architect decides exactly how it hooks the existing death.

## Acceptance criteria
- [ ] Kill a Dot and a Puff in the same match: two pops, and the Dot's is clearly higher-pitched than the Puff's.
- [ ] A Puff popping into three Dots plays exactly one pop.
- [ ] Kill a whole crowd at once: the pops overlap but the mix stays clean (no loud buzz) and nothing stutters or drops frames.
- [ ] On a phone, tap Play, then kill a monster: the pop plays (audio started on the tap).
- [ ] The pop is short (under about 0.15 s) and quiet enough that a brighter level-up sound can sit on top of it later.
