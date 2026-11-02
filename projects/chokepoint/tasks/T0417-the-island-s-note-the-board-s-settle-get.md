---
id: T0417
title: "The island's note: the board's settle gets its thud"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-02T10:20:00Z
claimed_at: 2026-11-02T10:20:14Z
designer: yoga
---

## Goal
The board's drop-in (T0407) is the run's opening beat and it is silent; one soft low thud at the moment the board settles makes the arrival felt the way every other structural moment is already heard (the run's end, the wave clear, the move's blip).

## Details
- One new sound, the settle thud: a single sine falling from ~90 Hz to ~60 Hz over ~150 ms at volume 0.12 — the sting's quiet class (T0091 is 0.1), clearly below the leak thud's prominence (0.25): it has to be heard under the draft bed (T0372) without fighting the cards' reveal chimes.
- It plays exactly once per new run, at the moment the drop-in tween completes (the board first rests at rest scale, ~400 ms into the run's open) — the drop-in's own gate: never on a resumed run, never on the menu demo (T0407's gate).
- One new Sfx method (closest example: `Sfx.leakWarn()`, a quiet one-note) and one call site where the drop-in's tween completes (closest example: `Sfx.speedBlip()`'s single call site in WaveSpeed). No change to the tween, the drop-in's look or any HUD; silent with the sound toggle off.

## Acceptance criteria
- [ ] Starting a new run plays exactly one soft thud at the moment the board finishes settling; a resumed run and the menu demo play none.
- [ ] The thud is a single ~150 ms low note quieter than the leak thud, and it does not play with the sound toggle off.
- [ ] The drop-in's look, timing and gate are unchanged; `npm run check` and the desktop + mobile smoke pass.
