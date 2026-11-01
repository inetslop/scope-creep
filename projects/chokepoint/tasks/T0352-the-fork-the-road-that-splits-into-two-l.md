---
id: T0352
title: "The fork: the road that splits into two lanes"
size: L
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-01T10:31:35Z
epic: E13
---

## Goal
On some boards the road splits into two lanes and rejoins, and each enemy takes either — a build that covered one side of the road stops covering half the traffic, and the cells between the lanes become the board's best cover.

## Details
- **Which boards.** Some boards, one fork — the same seeded "some boards" trait rule the far gate (T0338) uses; a board may carry both the far gate and the fork. Whatever the far gate's introduction did for shared, saved and ghost boards applies to the fork the same way (same trait mechanism, no new save format). If a board's layout cannot make the fork's stretch, that seed's board simply has no fork.
- **What the player sees.** A way down the road the white road splits into two parallel lanes that rejoin before the exit. The lanes run parallel for the whole stretch (no bend inside the fork), spaced so a full row of build cells sits between them, and the stretch is at least 4 cells long. On a board without the far gate the split is at ~35% of the road's length and the rejoin at ~75–80%; on a board with the far gate the split is a short way (at least 2 cells) past the far gate's entrance, so its enemies reach the split walking the main road. The lanes are equal length: an enemy walks the same distance either one, so wave pacing and the "The long way" node are unaffected. Nothing is painted — the fork is the road's own shape, and the board preview in the daily pick shows the same shape.
- **The rule.** Each enemy, the moment it reaches the split, takes either lane — a coin flip on the run's seeded RNG, so a resumed wave replays the same lanes. The fork is seen as it happens (the enemy visibly turns into its lane); no telegraph. Speed, hp, gold and every other enemy rule are unchanged, and after the rejoin the road is as before. Bosses and their escorts take a lane like any enemy — a Titan and its Guard may end up in different lanes.
- **The cells between the lanes.** The generator guarantees the full row of build cells between the lanes on the fork's stretch (at least 4 cells). A tower on them stands one cell from each lane: double-cover ground in the spirit of the guaranteed choke cell (T0217), but a whole stretch of it, readable from the road's shape — no mark on the cell, no tech. The guaranteed choke and the switchback (T0310) are untouched: the choke is placed as today, in the single-road part of the road.
- **The far gate's share.** Unchanged: on a fork board with the far gate, its third of every non-boss wave still comes in through it, and those enemies take a lane at the split like the rest.
- **The name.** The fork is a named board trait in the same data the far gate lives in: name "The fork", the dry line "the road splits into two lanes and rejoins", source "some boards" — the row the boards reference (T0350) adds from that data.

## Acceptance criteria
- [ ] A seed with the fork trait generates a board whose road splits into two equal parallel lanes and rejoins before the exit; a seed without it generates the same board as before this change.
- [ ] In a wave, every enemy at the split takes one lane (50/50 on the run's seeded RNG) and visibly turns into it; a resumed wave replays the same lanes; every enemy reaches the exit having walked the same distance on either lane.
- [ ] A fork board has at least 4 build cells in the row between the lanes, and a tower built on one of them is in range of both lanes (its placement ring covers both).
- [ ] On a fork board with the far gate, the far gate's entrance is before the split and its enemies take a lane at the split; its share of the wave is unchanged.
- [ ] The board preview shows the fork's shape, and the board trait data carries the fork's name, dry line and "some boards" source for the boards reference's row.
- [ ] A full run on a fork board plays to game over and pays out like any other run (smoke test).
