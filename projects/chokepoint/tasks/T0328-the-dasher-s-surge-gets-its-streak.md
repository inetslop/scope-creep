---
id: T0328
title: "The Dasher's surge gets its streak"
size: S
priority: 3
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T01:14:01Z
claimed_at: 2026-11-01T01:14:14Z
designer: yoga
---

## Goal
The only dashing enemy's burst has no motion feedback once it leaves its white wind-up — a 3-cell surge in 0.3 s with no trail. Give the Dasher's surge a short purple streak trailing behind it, so the burst reads as speed the instant it happens.

## Details
- Only while a Dasher is in its dash (the 0.3 s surge of its `dashCycle`): a short flat purple streak trails behind the token along the road, opposite to its direction of travel.
- The Dasher's own purple at ~40% alpha — a single flat shape, widest at the token and tapering to a point at the tail, about one cell long (no color gradient, no glow, no outline; the board FX's "soft and quick" language).
- It fades out over ~100 ms the moment the dash ends and the Dasher returns to crawling.
- No sound, no input, no gameplay change. The Dasher's numbers, its white wind-up flash, its token look and its 3-cell dash distance are all untouched.
- A new per-frame enemy hook in its own file (`src/systems/enemyHooks/`), the same pattern as the Mute's silence ring and the boss's phase wind-up ring — a per-frame Graphics draw that shows while a condition holds and reads the enemy's own dash state. Add its one registration line to the enemy hooks index (`src/systems/enemyHooks/index.ts`). Nothing else changes.

## Acceptance criteria
- [ ] While a Dasher is in its 0.3 s dash, a short flat purple streak (its own color, ~40% alpha) trails behind it along the road, about one cell long, tapering to a point at the tail.
- [ ] The streak is absent while the Dasher crawls or winds up (the white telegraph is unchanged), and it fades out over ~100 ms the moment the dash ends.
- [ ] No sound, no new input, no gameplay change: the Dasher's hp/speed/gold, its 3-cell dash distance, its white wind-up flash and its token look are unchanged outside the streak.
- [ ] Only a new enemy-hook file and its one registration line are touched; the streak is drawn on the board only (no HUD element, no status chip over the token).
