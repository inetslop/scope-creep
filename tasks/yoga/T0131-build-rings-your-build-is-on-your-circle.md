---
id: T0131
title: Build rings — your build is on your circle
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T17:13:57Z
claimed_at: 2026-10-27T17:39:38Z
designer: desktop
---

## Goal
The build you have picked becomes visible on your own shape: every 4 total upgrade levels your circle gains one thin ink ring just outside its outline — up to 3 — so in the middle of the late-run chaos you can read how deep the run has gone.

## Details
- totalLevels = the sum of the levels of every distinct upgrade picked this run — the same count The Index (T0104) lists, pips included, Warm Start's pick (T0114) counted at run start. Rings = min(3, floor(totalLevels / 4)): the first ring at 4 total levels, the second at 8, the third at 12, and 12+ stays at 3.
- A ring is a flat 2 u ink circle drawn just outside the player's outline, at 4, 8 and 12 units past it — the same flat-stroke, hard-paper-cut-shadow convention as the player's own outline (no glow), and it swells with the level-up pulse (T0102), so the moment a threshold is crossed the whole build pops, not just the circle.
- The rings are pure art: the player's hitbox, stats and blue fill are unchanged. They are deliberately distinct from The Palette's swatch stripes (T0097), which are colored and sit on the circle.
- A fresh run starts ringless; rings appear the moment a threshold is crossed and persist for the rest of the run — picks only grow, nothing removes a level.

## Acceptance criteria
- [ ] At 4 / 8 / 12 total upgrade levels the player's circle gains its first / second / third 2 u ink ring just outside its outline; at 16+ levels it has exactly 3; a fresh run (and any run before 4 total levels) has none.
- [ ] A ring appears the moment its threshold is crossed — with the level-up pulse — and persists for the rest of the run.
- [ ] The rings are ink, outside the outline, and never read as The Palette's colored swatch stripes; the player's hitbox and stats are byte-identical to before.
- [ ] No new sound, HUD element, key or scene; the pause-screen Index and everything else is untouched.
