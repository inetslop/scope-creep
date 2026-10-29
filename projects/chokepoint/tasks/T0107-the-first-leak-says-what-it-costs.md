---
id: T0107
title: The first leak says what it costs
size: S
priority: 3
status: design
depends_on: []
attempts: 0
created: 2026-10-29T07:23:51Z
---

## Goal
Pillar 8 at the moment of paying: the run's first leak shows a small chip at the exit naming the price, so "a leak costs a life" is learned where it is first paid, not discovered by a number dropping.

## Details
- The first time this run's lives drop below its starting lives (the run's first leak), a small white chip — the name tag's chip look (T0085: rounded white card, bold 12 px muted ink) — pops at the exit gate with the text "leaks cost a life".
- Motion: ~200 ms in, ~1 s hold, ~300 ms out (the name tag's ~1.5 s total).
- Once per run: later leaks in the same run show nothing. A resumed run re-derives: a run whose lives are already below its starting lives has already seen it (no chip); a resumed run at its starting lives still gets the chip on its first leak.
- A Hauler's extra red "−5" gold pop (T0057) stays exactly as is: the chip names the life, the pop names the gold, and both can appear together on a first Hauler leak. The leak warning (T0014), the leak jolt and the lives number are untouched.
- No sound, no input, no rule change; a new small system file that watches the run's lives (the ExitWarning pattern, T0014 — a system that reads state, with no changes to the enemy or run flow), so it lands in its own file.

## Acceptance criteria
- [ ] The run's first leak (lives first below the starting value) shows the "leaks cost a life" chip at the exit for ~1.5 s; no later leak in the same run shows it.
- [ ] A run resumed below its starting lives never shows the chip; one resumed at its starting lives shows it on its first leak.
- [ ] A Hauler's first-leak case still shows the red "−5" pop alongside the chip; the leak warning and the lives number behave exactly as today.
