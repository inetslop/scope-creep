---
id: T0103
title: "Bloop: a low bloop when a Toss splash blooms"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T17:06:34Z
claimed_at: 2026-10-31T17:26:27Z
epic: E20
designer: yoga
---

## Goal
The Toss's arc blob lands silently; a low bloop at the splash tells every player around the spot the moment it strikes, so the dodge (moving during the ~1.25 s flight) is readable by ear, not only by eye.

## Details
- A new sound in `src/audio/sfx.ts`: `bloop(seed, age)` — a short low squeeze, a sine sweeping 160 Hz down to 70 Hz over 0.12 s, peak 0.08 (clearly lower and softer than the monster pop). Deduped once per effect seed and globally throttled to one bloop per 150 ms, with the same 6-voice cap as the pops — model it on the whump added for the Sting burst, which sits in the same file.
- Play it where the plop-splash area is drawn (`src/content/areas/plop-splash.ts`), the same way the sting-burst whump is wired into `src/content/effects/sting-burst.ts`: every client who sees a splash bloom hears it once, at the bloom (the 0.2 s the ring spreads out to radius 60).
- The plop-splash is used only by the Toss, so no other monster or weapon is affected. No new content file beyond the sound function.

## Acceptance criteria
- [ ] When a Toss blob's splash blooms on screen, a low bloop plays at the bloom, once per splash, and it sits under the action (softer and lower than a monster pop).
- [ ] A crowd of splashes at once (a Toss crowd, a busy field) never stacks: at most one bloop per 150 ms and at most six at once.
- [ ] The sound obeys the existing gates — nothing before the first gesture, silent when the match is not shown — and works on desktop and mobile.
