---
id: T0484
title: "The scatter: the ninth tag — the wave that appears across the road"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-03T09:29:27Z
claimed_at: 2026-11-03T10:07:21Z
designer: desktop
---

## Goal
The wave's tag set grows with a ninth tag: on a scatter wave the walkers do not walk in from the gate — each one pops in at a random point across the front half of the road. The wave has no front and no order, the board lights up all at once, and the answer is spread coverage: a tower at the road's middle covers the spawn zone and the back stretch, and a misplaced choke tower is a move (E15) against the preview's chip.

## Details
- **The rule.** A wave N is a scatter wave when N >= 19, N mod 9 == 1, and it is not a boss wave (a multiple of 10), not a quiet wave (a multiple of 4) and not already tagged by another march tag. The scatter joins the tag chain the short cut joined: one march tag per wave, the scatter never replaces an earlier tag (a candidate that is quiet, boss or already tagged keeps that tag). The tag's rule is a pure function of the wave number, like the other tags.
- **The spawn.** On a scatter wave every road-walking enemy spawns at a random point 15–55% of the way along its own road from its gate (one uniform roll per enemy, from the run's rng, so two runs of the same wave scatter to different points), with the normal spawn pop-in at that point — never at the gate, never past the road's middle. Spawn timing, enemy mix, threat, kill gold, clear bonus and every other wave value are exactly what an untagged wave of the same number has: only the spawn position changes. On a two-gate board each enemy scatters along the road of the gate it would have spawned from (the short cut's "own road" rule). The Flyer ignores the scatter (it never walks the road), and the boss lane never scatters (boss waves do not take the tag).
- **Why it is not a re-tuned short cut.** The short cut shifts the whole wave 40% back the road: the wave keeps its order and its front, and the answer is covering the back stretch. The scatter gives every enemy its own position: the wave has no front, order or shape, and a single choke stops nothing — enemies pop in behind it. The answer is covering everything in the front half.
- **The read.** No new mark and no new HUD element: the pop-in at the scatter point is the read. The preview's chip row shows the "scatter" chip during the build before the wave (the tag-chip row's pattern, T0422); the run's first scatter wave shows the one-time teach chip under the preview where the preview shows, "scatter: the wave appears across the road" (the T0092 pattern); the banner wears the chip at the wave's start (T0080); the tag's note (T0457) and the haptic (T0449) cover it as they cover every tagged wave — no new sound or buzz is defined here.
- **The reference.** The waves reference names itself from the plan's entry (T0264's pattern): name "scatter", line "the wave appears across the road".

## Acceptance criteria
- [ ] The tag rule is a pure function of the wave number and unit-tested over a range of N: N >= 19 and N mod 9 == 1 and not quiet, not boss and not already march-tagged gives "scatter"; a candidate that is quiet, boss or already tagged keeps its earlier tag.
- [ ] On a scatter wave every road-walking enemy pops in at a random point 15–55% along its own road (never at the gate, never past the middle); two runs of the same wave scatter to different points (the run's rng); the Flyer and the boss lane are untouched.
- [ ] A scatter wave's spawn timing, enemy mix, threat, kill gold and clear bonus are identical to an untagged wave of the same number.
- [ ] The build phase before a scatter wave shows the "scatter" chip on the preview's chip row; the run's first scatter wave shows the one-time teach chip under the preview where the preview shows: "scatter: the wave appears across the road".
- [ ] At the wave's start the banner wears the "scatter" chip, the tag's note plays and the haptic buzzes (the existing tag rows — nothing new defined here).
- [ ] The waves reference lists the tag: "scatter — the wave appears across the road".
- [ ] The game is playable end to end; the smoke test passes on desktop and mobile.
