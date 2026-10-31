---
id: T0315
title: The speed toggle gets its note
size: S
priority: 3
status: design
depends_on: []
attempts: 0
created: 2026-10-31T00:11:52Z
---

## Goal
The 2x fast-forward (T0019) is the run's loudest control — the wave rushes by — but its toggle is silent; a small blip says which speed is running, heard where the control is used.

## Details
- When the wave speed flips 1x → 2x (the button fills yellow, by tap or F), one 60 ms sine blip at G5, volume 0.1 (the quiet UI-blip class, T0032's tier chime).
- When it flips back 2x → 1x (the button un-fills, by tap or F), one 60 ms sine blip at E5, volume 0.1.
- Played from the one place the wave-speed state flips, so the button and F can never double-play; the un-fill when a wave ends and the speed resets itself plays no sound (otherwise every wave end would blip).
- Silent with sound off (the Sfx guard, T0035's toggle); nothing else changes — the button's fill, the F key, the 2x scaling and the pause are untouched.
- Closest example for the build: a new small method in `src/audio/Sfx.ts` (a sibling of `streakPay()`, T0290 — one quiet sine note) and the single call site where the speed flips (the closest: the single call site of `WaveCard.record()`, T0311).

## Acceptance criteria
- [ ] Tapping the speed button or pressing F during a wave plays the G5 blip as the button fills; flipping back to 1x plays the E5 blip as it un-fills.
- [ ] No blip when a wave ends and the button un-fills itself, and no blip outside a wave.
- [ ] With sound off, the toggle is silent; the 2x behavior, the F key and the button's look are unchanged.
