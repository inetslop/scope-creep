---
id: T0356
title: "The Colossus's return gets its flash"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-01T11:49:16Z
---

## Goal
The wave-10 Colossus's out-of-reach beat ends with a moment on the token, the way its other beats do: the player sees exactly when the towers can hit it again, instead of noticing the alpha pop.

## Details
- **The moment:** the instant the Colossus's out-of-reach beat (the 2.5 s at 50% alpha) ends and it is in reach again — the same out-of-reach state the windup ring (T0286) reads from the boss's reachClock. Fire on the edge of the transition, once per return, never per frame.
- **The look:** the token's own white tint wash — the same white the Dasher's telegraph and the Colossus's 0.5 s out-of-reach telegraph use — for ~0.3 s, then its normal purple at full alpha. If the tint state needs its own clock, add one field on the enemy the way T0347's splitClock sits there.
- **Display only:** no sound, no text, no chip, no ring, no haptics — the windup ring already counts the next beat and the quiet tone (T0284) already marks the departure; this marks only the return.
- **Scope:** any enemy with the Colossus's out-of-reach beat (today only the Colossus); a later boss with the same beat inherits it. Every other enemy, including the Titan and the Orb, byte-identical.
- **Files:** one new enemy-hook file `src/systems/enemyHooks/bossBack.ts`, registered in `src/systems/enemyHooks/index.ts` next to `bossPhase`. Model: `bossPhase.ts` (T0286 — the same state, the same per-frame pass) and `orbSplit.ts` (T0347 — the white tint). No change to waves, art, audio or the run's numbers.

## Acceptance criteria
- [ ] Wave 10: the moment the Colossus becomes hittable again after each out-of-reach beat, its token flashes white for ~0.3 s (the telegraph's own white) before settling — one flash per return, on every return in the wave, the first included.
- [ ] No flash on the 0.5 s white telegraph that starts a beat, on the boss's death, or on any other enemy — Titan, Orb and every regular byte-identical.
- [ ] No new sound, text, chip or ring; the windup ring, the out-of-reach tone, the arrival ring and the death beat are unchanged.
- [ ] A resumed run mid-beat fires the flash at the next return, once.
