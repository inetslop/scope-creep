---
id: T0129
title: "The surge warns: a dust ring and a low rumble where the swarm line walks in"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T21:28:31Z
claimed_at: 2026-10-31T21:52:17Z
designer: yoga
---

## Goal
The swarm surge starts at the edge of the field, where nobody is looking: a line of Dots is already walking before a player notices. A dust ring at the entry point and a low rumble show where the threat comes from and when it is coming.

## Details
- New effect `src/content/effects/surge-dust.ts`, modeled on `geyser-bubble.ts` (a ring that blooms, confetti, no glow): a small coral dust ring with an ink rim that blooms to radius 45 over 0.6 s, with 6 small coral confetti off it. Registered in `src/content/effects/index.ts`.
- In the swarm-surge director (`src/content/directors/swarm-surge.ts`), when a surge line spawns, create one `surge-dust` effect at the middle of the line's spawn edge — one per spawned line, not one per Dot.
- New sound in `src/audio/sfx.ts`, modeled on `bloop` (per-effect dedupe, one per 150 ms, gesture and match-on-screen gates): a low "rumble", a sine sweep from 110 Hz to 55 Hz over 0.5 s, peak 0.08, played the moment the dust ring blooms — clearly lower and longer than the Toss bloop and the monster pop.

## Acceptance criteria
- [ ] Every time a swarm surge line walks in from an edge, a small coral dust ring with 6 confetti blooms at the middle of the entry line and a low rumble plays, on desktop and mobile after the first gesture.
- [ ] The ring and the rumble happen once per spawned line and never on monster deaths, other events or pickups.
- [ ] The ring is a warm palette color (coral), ink-rimmed, no glow, and it is gone by the end of its 0.6 s bloom.
- [ ] A player standing off to the side hears the rumble before the line reaches the middle of the field.
