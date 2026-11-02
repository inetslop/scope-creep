---
id: T0447
title: "The double: the wave that comes twice"
size: L
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-02T22:27:29Z
claimed_at: 2026-11-02T22:27:33Z
epic: E22
designer: desktop
---

## Goal
The fifth wave tag, "double": from wave 21, deep-run waves sometimes come in two fronts — a first pulse, a lull, and a faster second front — so a wave can test the whole road, not only its front, and the player reads the second front coming on the next-wave button.

## Details
- The tag: "double". From wave 21, every 8th wave that is not quiet, tight, rush, short cut or a boss wave wears the tag. The schedule rides the short cut's own shape (isShortCutWave in core/waves.ts, T0440 — the closest example): a wave wears one tag, and a boss wave's plan is never tagged.
- The split: the plan's enemies in order — the first pulse is the first half (rounded up), the second pulse the rest. The second pulse's walkers walk at 1.2× the wave's own speed (the thin road's 10% slow still applies; a Flyer crosses as it always does).
- The lull: between the pulses, exactly 6 s of simulation time with no enemy on the road (2× fast-forward scales it like everything else, T0019).
- The wave's remainder: through the lull the next-wave button keeps its usual meaning — the second pulse's count still counts as coming.
- The chip: "double" on the preview card's chip line and on the wave banner's chip, the tag chip's existing mechanism (the chip rides the plan's tags, T0422, T0080) — no change to the preview's token row.
- The teach: the first double wave's preview names it once, under the preview card, the tag-teach's shape (T0092): "the wave comes twice — the second front walks faster".
- The wave ends when the second pulse is cleared (kills or leaks), as usual; the wave bonus is the normal one for its number.
- The waves reference (the pause's waves card, T0264) lists the double — it reads core/waves.ts; if the list is not automatic, add the line there.

## Acceptance criteria
- [ ] A unit test pins the double schedule: from wave 21 every 8th non-quiet/tight/rush/short-cut/boss wave is double, no wave wears two tags, and no boss wave is double.
- [ ] In a double wave the first half spawns on schedule, the lull runs 6 s of simulation time with no enemy on the road, and the second half spawns with its walkers at 1.2× speed.
- [ ] The preview shows the wave's total count with the "double" chip; the banner wears the "double" chip.
- [ ] The first double wave's preview shows the teach line once, never again in that run.
- [ ] The next-wave button's count through the lull includes the second half.
- [ ] The waves reference card lists the double.
