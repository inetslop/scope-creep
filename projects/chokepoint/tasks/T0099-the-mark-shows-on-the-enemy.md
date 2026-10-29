---
id: T0099
title: The mark shows on the enemy
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T02:55:25Z
claimed_at: 2026-10-29T02:57:43Z
epic: E4
designer: desktop-4070
---

## Goal
The Mark's effect is seen on the road: a marked enemy wears the mark (T0012) — the Epic rule-changer is visible, not only felt as extra damage.

## Details
- Today an enemy marked by the Mark augment looks exactly like any other enemy; the mark (T0012: marked enemies take 25% more damage from everything) is only felt when the damage lands.
- While an enemy is marked, one small tick in the Mark's own pink (the Mark is a pink square, T0012) rides just above the enemy — the name tag's chip language (T0085) shrunk to a glyph: a small rounded chip in the Mark's pink, no text, about a third of the name chip's size.
- The tick appears the instant the mark is applied and clears the instant the mark is off that enemy — however the mark's lifetime actually works (refreshed by re-marks, moved to a new target, or timed out — the architect reads the mark's state from the existing mark system and follows it exactly). A marked enemy that dies shows no tick, and a new or resumed run never shows a stale one.
- Display only: the mark's rule is untouched (which enemy is marked, the 25% more damage from everything, the cadence). No new input, no sound, no HUD element, no pause-screen line.
- It lands in its own files — one new enemy-hook file on T0085's pattern (one hook, one small effect) — and must not edit the shared augment files, the enemy token paint or the shape library: it reuses the name chip's look as-is.
- Closest examples: the name tag (T0085) for the chip look and the hook pattern; the Mark augment (T0012) for the color and the rule.
- This is the first slice of the parked enemy-telegraph idea (IDEAS): the Mark only — later slices (the Sprinter's ramp, the Splitter's crack) park behind it.

## Acceptance criteria
- [ ] An enemy marked by the Mark augment wears one small pink tick above it from the moment it is marked until the mark is off it; re-marking refreshes the tick, a retarget clears it from the old enemy.
- [ ] The tick is the Mark's pink in the name chip's shape (T0085) at glyph size with no text; unmarked enemies render byte-identically.
- [ ] The mark's rule is untouched (same target, same 25%, same cadence); a dead enemy shows no tick; a new or resumed run shows no stale tick.
- [ ] The work lives in one new enemy-hook file (plus a small effect file only if the chip needs one) and its registration line — the shared augment files, the enemy token paint and the shape library are untouched.
- [ ] Desktop 1280x720 and mobile 412x915 smoke pass.
