---
id: T0290
title: "The streak's pay gets its note: the life-back heard"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-30T16:07:56Z
---

## Goal
The run's one life-back (the clean streak, T0045) is seen today as the lives number's green pop under the wave sweep; give the once-per-run reward its own note, so it is heard as its own moment.

## Details
- A new quiet method in src/audio/Sfx.ts next to `waveSweep()` (T0240) and `sting()` (T0091): one soft two-note rise, the wave sweep's notes (E5 then G5, 80 ms sine each, 90 ms apart) at the sting's volume (0.1).
- It plays exactly when the streak pays: the same moment the lives readout's green pop plays (the existing payback feedback), on top of the wave sweep that clean wave already plays.
- Once per run (the streak pays once per run); a resumed run that has already paid never plays it. Silent with sound off.
- No HUD, no board mark, no new text.

## Acceptance criteria
- [ ] The clean streak's life-back plays the wave sweep and the new two-note rise; a clean wave that does not pay the streak plays only the sweep, exactly as before.
- [ ] The rise plays at most once per run, and never on a resumed run that has already paid.
- [ ] With sound off, nothing plays.
- [ ] The gate passes (typecheck, lint, unit tests, browser smoke test).
