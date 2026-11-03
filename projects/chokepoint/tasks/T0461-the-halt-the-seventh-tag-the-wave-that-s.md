---
id: T0461
title: "The halt: the seventh tag — the wave that stops at the road's middle"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-03T01:41:10Z
epic: E22
design_attempts: 1
---

## Goal
The wave's tag set grows a seventh march — the halt: a wave whose walkers stop 3 s at the middle of their own road. The middle becomes the wave's choke, and the halt is the first tag whose answer is the move (E15): a tower that doesn't reach the halt is cheaper re-pointed there than sold and rebuilt.

## Details
- **The march.** From wave 14, every ninth eligible wave (not quiet, not a boss wave, and a wave no other tag's cadence takes — the same exclusivity the existing tags use) is tagged **halt**: every walker that first reaches the middle of the road it walks — half its own route from its gate to the exit, the short cut's "own road" language — stops for 3 s of wave time and continues. The 3 s runs on the wave clock, so the 2× fast-forward scales it with everything.
- **Who halts.** Every enemy that walks the road: the halt is the wave's own march, not a tower's control — the Ward's immunity never applies, the root's shrug is never touched, and an Anchor can still root a halted enemy as usual. Flyers never cross the road and are untouched. Once per enemy: a Push gust that drags an enemy back past the middle never re-triggers it. A Dasher that is mid-dash when it reaches the middle finishes its dash, then halts. A halted enemy stands still like a rooted one — no new look or chip on it (the enemy's own look already shows it).
- **What it does to the wave.** While the front halts, the walk packs behind it at the choke, and a tower that reaches the halt cell sees the whole wave for the 3 s. On a fork board each route has its own middle, and a walker halts at the middle of the route it walks.
- **The answer, the move.** The tag's line names the stop and the middle; a player whose best tower sits off the middle pays the move's fee (60% of slot cost, 30% with The light move) to re-point it at the choke instead of selling (the refund's 70%, 80% with Soft sell) and rebuilding — the first tag answered by an action on an existing tower, not a placement.
- **The build-phase mark (the FlyTelegraph's pattern, its own new file).** While the build phase runs and the next wave is a halt wave, each route's middle cell wears one small muted horizontal bar on its face (a speed bump, muted ink, the board-fact mark's size class) — the declared wave's own march shown the way the flyer's crossing is (T0346). It is gone by the wave's banner.
- **The chip.** The tag chip's existing row (the preview's line under the tokens, the banner's chip) gains the halt's glyph: a small horizontal rounded bar in a palette hue no other tag's chip uses (the architect picks the free hue from the board's palette).
- **The reference and mobile.** The waves reference reads core/waves.ts, so the halt names itself with its one-liner ("the walkers stop 3 s at the road's middle"); the non-quiet tagged wave's one guarded buzz at the banner (T0449) covers it. No new input, no new HUD card.
- **Compared with what exists.** quiet halves the wave, tight packs the interval, rush speeds the walkers, the short cut moves the spawn, the double splits the front, the clumps break the chain — none of them stops the wave in place. The halt is the first positional stop, and the first tag whose answer is the move.

## Acceptance criteria
- [ ] In a run past wave 14, a halt wave wears the halt's chip on the preview's line and the banner, its one-liner in the waves reference, and the mobile buzz at the banner — and no halt lands on a quiet, boss or already-tagged wave.
- [ ] On a halt wave every road walker, Ward included, stands 3 s of wave time at the first middle of its own route and continues after; a Push that drags it back never re-triggers it; a flyer never stops; a Dasher finishes its dash first.
- [ ] Unit: on the same seed, the same wave's walkers each stand 3 s longer at their route's middle when the halt tag is on the plan than when it is off.
- [ ] The build phase before a halt wave shows the muted bar on each route's middle cell; it is gone by the wave's banner.
- [ ] The chip row wears the halt's bar glyph in a hue no other tag uses, and every line fits its card at 412x915 and 1280x720.
