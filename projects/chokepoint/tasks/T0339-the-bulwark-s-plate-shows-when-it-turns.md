---
id: T0339
title: "The Bulwark's plate shows when it turns a hit"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-01T04:12:33Z
---

## Goal
The Bulwark's front plate already halves shots into its face, but nothing on the board says so: a first-time player should see the plate working, so the rule is read from the board the moment it happens instead of only from the Enemies reference.

## Details
- Display-only, on the board: the instant a directed shot hits a live Bulwark's face and its damage is halved by the plate (the plate factor the plate module applies), the plate lights up — a brief brightening of the plate (its own color with a touch of white, ~40% white) that fades over ~120 ms.
- One lit state per Bulwark: a new front hit while it is already lit simply keeps it lit (it does not re-bloom or stack). The plate lights the moment a front hit is halved and stays lit ~150 ms after the last such hit, so a spray of front hits reads as a steady glow, not a strobe; when front hits stop it fades. A shot into the back (the side the plate does not halve) does not light it.
- The hook rides the plate-halving path exactly where the plate factor halves a face hit's damage — the same flag-then-read pattern as the Ward's deny ring (T0335): a display-only `plated` flag on the enemy, set where the plate halves a hit and reset in `spawn()`, read and cleared by the hook. New file `src/systems/enemyHooks/bulwarkPlate.ts`, registered in `src/systems/enemyHooks/index.ts` (one import, one `ENEMY_HOOKS` line, the `wardDeny` anchor pattern).
- No sound, no input, no gameplay change: the plate's 0.5 halving and the Bulwark's numbers (hp 120, speed 0.72, gold 10, 1 life) are untouched; the plate still halves face shots and lets back shots through.

## Acceptance criteria
- [ ] A directed shot that hits a live Bulwark's face and is halved by its plate lights the plate briefly; a shot into the back does not.
- [ ] The plate lights the moment a face hit is halved and stays lit ~150 ms after the last face hit (a steady glow while face hits keep landing), fading ~120 ms after the hits stop; it never re-blooms or stacks mid-glow.
- [ ] Display-only: the plate's halving, the Bulwark's hp, speed, gold and leak cost are unchanged; no sound; no new input.
- [ ] No light on any enemy without a plate; the hook is a new file registered in the enemy-hook list; typecheck, lint, unit tests and the smoke test pass.
