---
id: T0411
title: The wave clear gets its note
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-02T06:19:02Z
---

## Goal
A clean wave is seen — the green chip, the sweep — but a perfectly held wave is the run's core good beat and it is silent; one soft two-note rise marks the moment the chip pops, so the clean clear is heard as well as seen.

## Details
- When a wave ends with zero leaks — the clean chip's own moment, where the chip pops at the exit gate (T0005) — one soft two-note rise plays: sine C5 then E5, 80 ms each, volume 0.1 (the tier chime's own volume, T0032) — a step below the claim's coin chime (T0009, E5→G5 at 0.18).
- Once per clean wave clear. A held wave (any leak) plays nothing at all — the leak's own thud already spoke, and a second note would argue with it.
- The note plays in every mode (Play and Iron; the storm when it lands is covered automatically — the clean chip's moment is mode-blind).
- Silent with sound off (the pause's own toggle, T0035).
- Exact file and closest example: one new method on the run's sound file, `src/audio/Sfx.ts`, modeled on the streak's note (T0290 — the quiet two-note rise) and the tier chime (T0032 — the 0.1 volume). The single play call goes at the clean chip's own show path — the clean branch of the wave-clear flow where the chip pops (T0005) — one line, next to the chip. No new HUD element, key, button or board mark; the chip and the sweep are untouched.

## Acceptance criteria
- [ ] A wave that ends clean plays one soft two-note rise (C5→E5, 80 ms each, vol 0.1) at the clean chip's moment, once per clean wave.
- [ ] A wave with any leak plays no such note; the leak thud is unchanged.
- [ ] With sound off (the pause's toggle) the note is silent; the chip, the sweep and every other sound are unchanged.
- [ ] `npm run check` and the desktop + mobile smoke pass.
