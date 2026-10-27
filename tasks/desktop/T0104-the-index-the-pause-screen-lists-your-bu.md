---
id: T0104
title: The Index — the pause screen lists your build
assignee: desktop
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T11:11:53Z
claimed_at: 2026-10-27T11:32:50Z
designer: desktop
---

## Goal
When you pause, you can read your run back: the pause screen lists every upgrade you picked this run in a narrow ink column, so a 16-pick build is legible at a glance instead of remembered. "Every level-up is a decision" only lands if the build you made is visible.

## Details
- Pause screen only — no in-game HUD element, no new key or button, no new sound.
- A narrow ink column set in the same small-caps ink type as the existing pause text, with a small "PICKS" header above the first line. Placed beside the existing pause content — to its right in landscape (1280×720), below it in portrait (412×915) — never overlapping the resume/quit controls, with at least 12 units of paper margin around it.
- One line per distinct upgrade picked this run (weapon cards included — Line, Orbit, Arc and Counterpoint are single-level entries). Pips: one small flat square per level, tinted in that upgrade's card color (the same color its level-up card shows), flat squares not circles.
- Order: most recently picked first — the decision you just made sits at the top of the column.
- Bounded by the pool: at most 16 lines, and a line's pips never exceed that upgrade's max level — the whole column always fits 412×915 and 1280×720 with no scroll and no clipping.
- Empty state: before the run's first level-up the column shows one dry line instead of entries: "NOTHING PICKED YET".
- Data: read from the run's existing ordered upgrade-pick record (the same record the stat pipeline and the level-up flow already use). No new tracking, nothing stored between runs. If a read-only accessor for the pick record is missing, add one.

## Acceptance criteria
- [ ] Pick Rhythm twice and Weight once in a run, then pause: the column shows exactly two lines — "RHYTHM" with 2 pips and "WEIGHT" with 1 pip — most recently picked on top, pips in the two card colors.
- [ ] Pausing before the run's first level-up shows the single line "NOTHING PICKED YET" in the same column position.
- [ ] Weapon cards appear as single lines with 1 pip (picking the Orbit card adds one "ORBIT" line); a weapon is maxed after one pick and is never offered again.
- [ ] A maximal build (16 distinct upgrades, each at its max level) fits fully in both 412×915 portrait and 1280×720 landscape — no scroll, no clipped lines — and no line ever shows more pips than that upgrade's max level.
- [ ] The list is per-run: empty at the start of a new run, never carried over from a previous one; resume, quit and every other pause-screen element behave exactly as before.
