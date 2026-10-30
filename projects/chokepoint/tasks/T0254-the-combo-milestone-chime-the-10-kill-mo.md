---
id: T0254
title: "The combo milestone chime: the ×10 kill moment, heard"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-30T04:48:47Z
epic: E4
---

## Goal
The kill chain's loudest moment gets a note: the moment the ×N counter reaches ×10 — the milestone that already turns it yellow and doubles its chips (T0034) — one soft two-note chime plays, so the chain (which E4's Feast turns into a live damage buff, T0235) is heard at its peak.

## Details
- One soft two-note ascending chime: E5 (~659 Hz) then G5 (~784 Hz), 80 ms sines each, 90 ms apart, volume 0.1 — the coin chime's notes (T0009) at the tier chime's quiet class (T0032), the same shape as the wave-clear sweep (T0240). A new two-note method in the Sfx module (`src/audio/Sfx.ts`) next to `waveSweep()`.
- Played once per chain, from the one place that decides the milestone: `src/systems/FxSystem.ts`'s `killCount()` (T0034) returns the ×10 milestone — the chime plays there, and nowhere else.
- The 5th kill of a chain (T0066's gold milestone) plays no chime; kills ×11 and up in the same chain stay silent; a later chain plays again at its own ×10.
- The chime is scene-level: at 2× fast-forward (T0019) it plays once, never stretched or doubled.
- Silent when sound is off (T0035). Procedural, no sound file.
- No new HUD or board mark: the yellow counter and the 12-chip burst (T0034) already show the moment; this adds its note.

## Acceptance criteria
- [ ] The kill that brings the counter to ×10 plays one E5→G5 chime (80 ms sines, 90 ms apart, volume 0.1); the ×5 gold milestone (T0066) plays no chime.
- [ ] Exactly one chime per chain: ×11 and later in the same chain are silent, and a later chain plays again at its own ×10.
- [ ] At 2× fast-forward (T0019) the chime plays once, and the yellow counter and the 12-chip burst are unchanged.
- [ ] With sound off (T0035) the milestone stays fully visible and the chime is silent.
