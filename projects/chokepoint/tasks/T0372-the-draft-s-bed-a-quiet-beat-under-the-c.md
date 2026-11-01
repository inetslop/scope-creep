---
id: T0372
title: "The draft's bed: a quiet beat under the card pick"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-01T18:12:12Z
---

## Goal
The pick is the run's biggest decision, but it is the only beat of the run's loop with no bed: the build has its quiet pulse (T0365), the wave has its heartbeat (T0239), and the draft is silent under its tier chime. A quiet, sparser beat under the card pick completes the three-beat loop T0365 framed (calm build, the wave's heartbeat, the draft's pick), so the run's phases stay distinct to hear.

## Details
- A new generative bed in its own file, modeled on the build bed (`src/audio/buildBed.ts`, T0365 — the closest example): a 3-note sine loop (G2, E3, G3) at 1.2 s steps, volume 0.025 — slower, sparser and a touch quieter than the build bed's 4-note (E2, B2, E3, G3) 0.8 s / 0.03 loop, and clearly distinct from the wave bed's 8-note E–G–A 0.4 s / 0.04 loop, so the three beds never blur into one.
- The draft scene owns its bed: it fades in over 0.6 s the moment the draft opens (the cards' flip starts on top of it) and fades out over 0.6 s the moment the pick commits and the draft closes — one start point, one stop point, in the draft scene's own open/close. A reroll (T0276) keeps the draft open — the bed keeps playing, no re-fade.
- No forms of it: no last-stand form, no Iron form, no quicken — the pick's calm is the same at any stakes. The build bed's last-stand form (T0342) and the wave bed's quicken are untouched, and the build bed (T0365) and wave bed (T0239) stay byte-identical.
- Silent in the menu, during the build phase, during waves and while paused; obeys the pause screen's sound toggle (T0035) like the other beds.
- The draft's tier chime (T0032), the card flip (T0024) and the Epic frame shimmer (T0041) are unchanged. No HUD, no new button or key, no text.

## Acceptance criteria
- [ ] Opening the draft — the pre-wave-1 pick and every pick after a cleared wave — fades the bed in over 0.6 s, and committing a card fades it out over 0.6 s; the bed is silent in the menu, during the build phase, during waves, while paused, and when the sound is off.
- [ ] The loop is exactly 3 sine notes (G2, E3, G3) at 1.2 s steps and 0.025 volume — slower, sparser and quieter than the build bed, distinct from the wave bed; the build bed, the wave bed and the last-stand bed form are byte-identical to before.
- [ ] A reroll keeps the bed playing with no re-fade; the tier chime, the flip and the Epic shimmer are unchanged; a run plays end to end from the first pick to game over.
