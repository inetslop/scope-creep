---
id: T0479
title: "The Hauler's leak pays its note: the coin blip when its 5 gold is taken"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-03T07:13:15Z
claimed_at: 2026-11-03T07:13:52Z
designer: yoga
---

## Goal
A Hauler's leak costs 1 life and 5 gold (T0057); the first-leak chip teaches the cost (T0307), but the gold taken is still silent — the thud says "life", nothing says "gold". One quiet coin blip at the exit the moment a Hauler leak actually takes its gold.

## Details
- When a Hauler leaks and its 5-gold cost takes at least 1 gold from the run, one soft falling two-note coin blip plays at the exit gate: G4→E4, 60 ms, volume 0.08 — the run's quietest class (the Ward note's class, T0474), below the hit blip.
- One blip per Hauler leak. A Hauler leak that takes no gold (the run is at 0) plays nothing; no other leaker (a Dot, a Block, a boss, a split piece) ever plays it.
- Silent with the sound toggle off; no visual, no HUD, no new mark — the leak's thud, jolt and echo are untouched.
- Shape and files: the Ward note's pattern (T0474) — a new display-free hook file beside `src/systems/enemyHooks/wardDenyNote.ts`, riding the leak path the way the leak's Toll blip (T0255) rides it, so it reads the leaker's type and whether gold was taken; one `haulerLeak()` method in `src/audio/Sfx.ts` beside `wardDeny()`; one registration line in `src/systems/enemyHooks/index.ts`.

## Acceptance criteria
- [ ] A Hauler leak whose 5-gold cost takes gold plays one soft falling two-note blip (G4→E4, 60 ms, 0.08) at the exit, once per leak.
- [ ] A Hauler leak at 0 gold plays nothing; a leak of any other enemy type never plays it.
- [ ] With sound off it is silent; the leak's thud, jolt, echo and held chip are unchanged; no visual or HUD change.
