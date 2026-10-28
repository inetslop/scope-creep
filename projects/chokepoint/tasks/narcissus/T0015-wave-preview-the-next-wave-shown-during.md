---
id: T0015
title: "Wave preview: the next wave shown during the build phase"
assignee: narcissus
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-28T02:08:37Z
---

## Goal
The build phase is for planning, not guessing: during the build phase a small card shows what the next wave sends — each enemy's shape and its count.

## Details
- During the build phase (the countdown before a wave), a small white rounded card (the game's card style) appears near the existing build-phase countdown display (closest example: the UI that shows the seconds until the next wave): the next wave's composition, e.g. "Dot ×8 · Dart ×3".
- Each enemy type appears as its small shape icon (the same shape and color as on the board, ~16 px) followed by its count. Only types the wave actually sends appear — no ×0 lines.
- The preview reads the wave's own data; it never lists enemy types by hand, so when new enemies join the waves later (e.g. the Sprinter, T0006) they show up here automatically.
- The card pops in over 200 ms (the existing card pop) when the build phase starts and is gone by the time the wave starts. It never covers the road, the countdown, or the hand strip.
- No new inputs, no pause-screen change.

## Acceptance criteria
- [ ] During the build phase the preview card shows exactly the next wave's enemy types and counts; a type with 0 count is absent.
- [ ] The card's icons match the on-board enemy shapes and colors at a glance.
- [ ] The card pops in at the build phase start and is gone at wave start; at 412x915 and 1280x720 it covers nothing else.
- [ ] No enemy type is hardcoded: after T0006 lands, Sprinters appear in the preview with no further change to this task's code.
