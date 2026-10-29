---
id: T0131
title: "Beam combos II: Lance pierces, Splash scorches, Spray splits a beam kill"
size: M
priority: 2
status: failed
depends_on: []
attempts: 0
created: 2026-10-29T10:40:00Z
claimed_at: 2026-10-29T11:28:00Z
finished_at: 2026-10-29T13:05:42Z
epic: E4
design_attempts: 2
---

## Goal
The shape augments do nothing on a Beam-first tower today. Give each one the beam version of its card line, so Lance, Splash and Spray each change where a beam does its damage.

## Details
Applies to a tower whose **first** augment is Beam. Values per second scale with the beam's own rate (6/8/10 by tier) and with any multipliers the tower has.
- **Lance added ("+1 pierce"):** the beam does not stop at its target: it continues in a straight line to the tower's full range and damages the first N more enemies it passes through (N = the tower's pierce), each at the full beam rate. The line is drawn to the last enemy it touches (or to the range edge when N is not used up), with the hit tick on each enemy struck.
- **Splash added ("Hits burst over 1 cell, to 2 more enemies"):** the beam's hit end scorches: up to SPLASH_CAP - 1 (2) other enemies within the Splash radius (1 / 1.5 / 2 cells by Splash tier) of the beamed enemy take **half** the beam rate per second. Show it as a faint ring (the tower's color, 30% alpha) at the hit end while anything is scorched, not the shot burst ring every frame.
- **Spray added ("+1 needle per split"):** when a beam kills its target, the corpse splits into 1 homing needle per Spray added (12 damage each, Spray's needle look and speed) that seek the nearest other enemies within 2 cells. Only kills, not every tick.
- **Panel:** the tower's description gains one clause per augment, e.g. "the beam pierces 1 more", "scorches 2 nearby at 3 per second", "a beam kill splits into 1 needle".

## Acceptance criteria
- [ ] Beam first + Lance: with two enemies in a line within range, both take the full beam rate; the line is drawn through to the second.
- [ ] Beam first + Splash: up to 2 enemies within 1 cell of the beamed enemy take half the beam rate; enemies further away take nothing; the faint ring shows while it scorches.
- [ ] Beam first + Spray: a beam kill releases 1 needle per Spray toward the nearest other enemy within 2 cells; no needles without a kill.
- [ ] Unit tests pin the pierce count, the scorch rate and cap, and the needle count.
- [ ] The tower panel describes each effect.

## Architect could not design it (cachyos-x8664)

no "STATUS: READY" line after 2 attempt(s). Last output:

```
Prompt is too long
```
