---
id: T0141
title: Low-HP vignette — the page reads your danger
assignee: desktop
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T19:57:25Z
---

## Goal
When you are close to being erased, the page itself warns you: the paper's edges fall into a warm shadow and a thin red rule pulses along the boundary, so how close you are to death is readable at a glance without checking the HP bar.

## Details
- A new danger state on the player, owned by a **pure rule module in `src/core/`** (the crop/rest pattern) with unit tests.
- The vignette turns **on** the moment the player's current HP is at or below **25%** of their max HP, and turns **off** only when it rises back **above 30%** of max HP (a small hysteresis so it does not flicker on and off while Balance regen climbs back across the threshold). It is latched: between 25% and 30% it stays in whatever state it was in.
- While on, two things are drawn, both fading in over 200 ms on turning on and out over 200 ms on turning off:
  - Four flat **warm-shadow bands** darken the four paper edges — a single flat shade a step darker and warmer than the paper (a new flat palette tone; flat, no gradient, no glow), ~40 u thick on each edge.
  - A **2 u red** (PALETTE.red) rule pulses along the crop-safe boundary — the same boundary the BossApproach red line tracks (T0070), so it stays correct through the Crop shrink (T0045) and the Tide breathing edge (T0127) — alpha **0.25 → 0.75 → 0.25** over a **1.0 s** cycle.
- It is **pure readability**: it deals no damage and changes no stat, spawn, hazard, weapon, run clock or music.
- The pure rule module exposes the state transition given a previous state and the current HP fraction, and unit tests lock: off above 30%, on at exactly 25%, latched on between 25% and 30% (holding the state in both directions), off again above 30%, and on→off ordering.
- No new key, sound, HUD element, scene or marginalia.

## Acceptance criteria
- [ ] With HP below 25% of max, the four paper edges show flat warm-shadow bands and a 2 u red rule pulses along the safe boundary on a 1.0 s alpha cycle; both fade in over ~200 ms.
- [ ] Healing back above 30% of max HP removes both the bands and the red rule (fading out over ~200 ms); between 25% and 30% the vignette stays in its current state (no flicker).
- [ ] The vignette changes no gameplay: no damage, stat, spawn, hazard, weapon, clock or music change — it is visual only.
- [ ] The red rule follows the crop-safe boundary as it shrinks (Crop) and breathes (Tide), exactly like the BossApproach red line.
- [ ] Correctly laid out and legible at both 412×915 (mobile portrait) and 1280×720 (desktop).
- [ ] A pure rule module with unit tests for the 25%/30% hysteresis (on at ≤25%, latched, off above 30%); the full gate (typecheck, lint, unit tests, desktop + mobile smoke) passes.
