---
id: T0240
title: "The wave-clear sweep: E5→G5 at the beat before the draft"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-29T23:53:23Z
---

## Goal
The phase change from wave to draft is heard as well as seen: a soft two-note rising sweep in the beat between a wave ending and its draft opening, so the run's rhythm — build, fight, pick — is felt without a new mark anywhere.

## Details
- A new method in `src/audio/Sfx.ts` — the closest example is `Sfx.tierChime` (T0032: one 80 ms sine per note, the same quiet class): two 80 ms sine notes, E5 then G5 (the coin chime's interval, T0009), the second starting 90 ms after the first, volume 0.1 (the tier chime's volume).
- It plays once, at the moment a wave ends and the run moves to the draft — the same beat the exit's "Clean" chip waits for (T0005). It never plays when the run ends instead: the game over keeps its own coin chime (T0009) and nothing else.
- Silent with the sound off (T0035). No new HUD element, no input; the coin chime, tier chime and every other sound stay byte-identical.

## Acceptance criteria
- [ ] When a wave ends and the draft opens, one soft two-note rise plays: E5 → G5, 80 ms each, sine, 90 ms apart, volume 0.1.
- [ ] It plays exactly once per wave end that opens a draft; it never plays on the run's end (the game over keeps only the coin chime); it is silent with the sound off (T0035).
- [ ] No new HUD element, no input, no change to any existing sound; check and smoke pass on desktop and mobile.
