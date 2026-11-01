---
id: T0344
title: "The Splitter's crack deepens as it takes damage"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T07:03:24Z
claimed_at: 2026-11-01T07:03:48Z
designer: yoga
---

## Goal
A Splitter is "a cracked Dot" and splits on death — its crack should read as a countdown: the closer it is to splitting, the deeper the crack, so a first-time player sees the shape that is about to break before it does.

## Details
- The Splitter's token (red circle, size 0.264) wears one crack line across its face. The line is drawn in muted ink (the token's own dark-side shade — no new color), and its alpha tracks the damage taken:
  - alpha = 0.25 + 0.75 × (1 − hp / maxHp), re-derived every frame from the enemy's live hp.
  - A full-health Splitter wears a faint 25% crack (its resting look); at half health ~63%; at the split edge it is full strength.
  - No width change, no sound, no text, no chip, no HUD.
- If the token already bakes a crack into its shape, the hook owns that line: exactly one crack line is visible at all times (align with the baked line, never add a second).
- A fresh spawn and a resumed run set the baseline silently: the crack matches the live hp from the first frame and never replays a "deepening" (the re-derived-every-frame pattern; the closest example is `src/systems/enemyHooks/sprinterRamp.ts`).
- Display only: the split rule, the Splinter, and the Splitter's numbers (hp 90, speed 1.2, gold 8, from wave 9) and the wave mix are untouched.

## Acceptance criteria
- [ ] A full-health Splitter shows the crack at ~25% alpha; as it takes hits the same line deepens, reaching full alpha just before it splits, and two Splitters at different health show different crack depths at the same time.
- [ ] Exactly one crack line is visible on the token at all times.
- [ ] On a fresh spawn or a resumed run, the crack matches the live hp from the first frame with no replay animation.
- [ ] One new enemy-hook file in `src/systems/enemyHooks/` registered in its index (one import + one line, the `sprinterRamp` pattern); the split, the Splinter, the numbers and the wave mix are unchanged; no sound, no text, no HUD element.
