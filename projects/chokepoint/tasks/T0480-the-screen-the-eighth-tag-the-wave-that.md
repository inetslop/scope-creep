---
id: T0480
title: "The screen: the eighth tag — the wave that walks as one front"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-03T07:54:13Z
---

## Goal
The wave's march set (quiet, tight, rush, short cut, double, clumps, the halt) grows an eighth — the screen: a wave whose whole count walks as one front, so the front stretch of the road sees the whole wave at once and the answer is the burst build there.

## Details
- **The march.** From wave 18, every eleventh eligible wave (not quiet, not a boss wave, and a wave no other tag's cadence takes — the same exclusivity the existing tags use) is tagged **screen**: every walker's spawn falls within the first 1.5 s of wave time — the wave's normal spawn span is collapsed into that one window, and the wave walks the road as one thick front. The composition, hp, speed and gold are all unchanged: the screen changes the arrival, not the wave's contents, and the tag rides the wave number and the seed like the other tags (no new run state, no save change).
- **Who screens.** Every walker that walks the road, the Ward included — the screen is the wave's own march, not a tower's control: the Ward's immunity never applies and the root's shrug is never touched (the halt's language). On a far-gate board the wave splits across the gates as today and each gate's share bursts within the same 1.5 s window at its own gate. Flyers cross their line as they do; a Dasher that spawns in the window keeps its own crawl-dash cycle.
- **What it does to the wave.** The front stretch — the road near the spawn — sees the whole wave at once: a tower there must hit many at once or the front walks past it, and the front stretches into a stream only as the walkers' own speeds differ, so the screen's moment is the arrival, the wave's first stretch of road (the board shows it: a band of tokens crossing the white road together).
- **The answer.** The burst build at the front stretch — splash's three, spray's five pellets, the beam's line on the front's edge — and the placement that covers the front, where the tight's answer is spread and the halt's is the move. No new action, tool or rule: the burst towers and the placement already exist.
- **The chip and the teach.** The tag chip's existing row (the preview's line under the tokens, T0422; the banner's chip, T0080) gains the screen's glyph — three small dots stacked in a column (a wall of tokens), in a palette hue no other tag's chip uses (the architect picks the free hue from the board's palette). The run's first screen preview teaches once, a muted line under the preview card — "the whole wave walks as one front" — derived from the wave number the way the existing tags' teach lines are (T0092). The waves reference reads core/waves.ts, so the screen names itself with the same one-liner; the non-quiet tagged wave's one guarded buzz at the banner (T0449) and its quiet note (T0457) cover it with no change.
- **Compared with what exists.** quiet halves the size, tight packs the interval, rush speeds the walk, the short cut moves the spawn, the double splits the front, the clumps break the stream, the halt stops the front in place — none of them collapses the whole wave into a single front that crosses the road together. The screen is the first wave that arrives as one wall, and the first tag whose answer is the burst build at the front stretch.
- A wave without the screen tag is byte-identical to today: the spawn span, the walk, the preview, the banner and the reference all stand as they are.

## Acceptance criteria
- [ ] In a run past wave 18, a screen wave wears the screen's chip on the preview's line and the banner, its one-liner in the waves reference, and the mobile buzz at the banner; the first one also wears the muted teach line under the preview; no screen lands on a quiet, boss or already-tagged wave.
- [ ] On a screen wave every walker's spawn falls within the first 1.5 s of wave time (a far-gate share within the same window at its own gate), the front walks the road together as one thick band, and it stretches into a stream only as the walkers' own speeds differ.
- [ ] Unit: on the same seed, the screen wave's spawn offsets all fall within 1.5 s of wave time while the same wave without the tag keeps today's spawn span, and no other wave is changed by the tag's presence.
- [ ] The chip row wears the screen's three-dot column in a hue no other tag uses, and every line fits its card at 412x915 and 1280x720.
- [ ] At the wall's peak the board stays readable — tokens, health bars and the road draw as today — and a wave without the tag is byte-identical (npm run check green).
