---
id: T0375
title: "The Flyer's streak: the sky shows its motion"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-01T19:38:40Z
epic: E10
---

## Goal
A first-time player reads the Flyer as moving through the air, not walking the road: a short fading streak trails it while it crosses.

## Details
- While a regular (non-boss) Flyer is in the sky, a short flat streak trails behind it, stretched along its current motion, in the Flyer's own body color.
- The streak is ~1.5× the Flyer's token length, tapers to a point at its back, ~25% alpha, and re-derives each frame so it always points where the Flyer came from. It sits at ground level under the Flyer's token, like a motion afterimage.
- Display only: no sound, no text, no chip, no hitbox. It does not change the Flyer's flight line, hp, speed, gold or threat.
- The Flyer's direction comes from its existing flight velocity (set by T0353's crossing); the hook reads it, it adds no new enemy fields.
- Closest example: the Dasher's surge streak (T0328) — same flat, soft, color-of-the-enemy language.
- Bright minimal: a flat soft shape in the Flyer's color; no glow, no gradient, no outline.

## Acceptance criteria
- [ ] While a regular Flyer flies, a flat streak in its own color trails behind it along its motion, updating every frame.
- [ ] The streak is absent before the Flyer spawns and the instant it dies or leaks.
- [ ] The wave-50 boss Flyer is untouched (it keeps its own telegraph); the streak applies to the regular Flyer only.
- [ ] No sound, text, chip, or gameplay change; the rest of the game is byte-identical.
- [ ] Typecheck, lint, unit tests, and the desktop/mobile smoke pass.
