---
id: T0210
title: "Beam combos II: Lance pierces the beam, Splash scorches its target"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T13:49:24Z
claimed_at: 2026-10-29T14:10:19Z
epic: E4
designer: inet-racing
---

## Goal
The shape augments do nothing on a Beam-first tower today. Give Lance and Splash the beam version of their card lines, so each changes where the beam does its damage. (The middle slice of the beam trilogy: T0130 I — Bolt's rays, Rapid and Rally's feed; this II; T0132 III — the beam carries the support auras. The original T0131's third clause — a beam kill splitting into Spray needles — is filed separately after this lands.)

## Details
Applies to a tower whose **first** augment is Beam (the beam tower). Beam added to other towers is unchanged. Values per second scale with the beam's own rate (6/8/10 by the Beam's tier) and with any multipliers the tower has (T0130's rapid/rally feed, if landed).
- **Lance added ("+1 pierce"):** the beam does not stop at its target: it continues in a straight line to the tower's full range and damages the first N more enemies it passes through (N = the tower's pierce — Lance's own pierce count, 1/2/3 by Lance tier), each at the full beam rate. The line is drawn to the last enemy it touches (or to the range edge when N is not used up), with the hit tick on each enemy struck.
- **Splash added ("Hits burst over 1 cell, to 2 more enemies"):** the beam's hit end scorches: up to SPLASH_CAP − 1 (2) other enemies within the Splash radius (1 / 1.5 / 2 cells by the Splash's tier) of the beamed enemy take **half** the beam rate per second. Show it as a faint ring (the tower's color, 30% alpha) at the hit end while anything is scorched, not the shot burst ring every frame.
- **Scope against T0130:** the pierce and the scorch act on the beam's main line only. If T0130 has landed, its extra rays are plain full-rate beams (they do not pierce or scorch) and the main line sits in the held layout as today (held[0]); build against its `beamLines` signature. If T0130 has not landed, build against the beam as it is — T0130 composes on top (its rays ignore pierce and scorch).
- **Panel:** the tower's description gains one clause per augment that is present, e.g. "the beam pierces 1 more", "scorches 2 nearby at 3 per second".

## Acceptance criteria
- [ ] Beam first + Lance: with two enemies in a line within range, both take the full beam rate and the line is drawn through to the second; with a Lance Epic (pierce 3) and three enemies in a line, all three take the rate.
- [ ] Beam first + Splash: up to 2 enemies within 1 cell of the beamed enemy take half the beam rate; enemies further away take nothing; the faint ring shows while anything is scorched and is gone the moment no one is in the radius.
- [ ] Unit tests pin the pierce count (per Lance tier), the scorch rate and cap, and the radius per Splash tier.
- [ ] If T0130 has landed: a beam tower with extra rays still feeds every ray at the full rate, and the rays do not pierce or scorch; the main line's pierce and scorch compose with the rays' shared multiplier (the per-frame damage still equals the panel's damage-per-second line).
- [ ] The tower panel's description says each effect that is present.
- [ ] Byte-identical: a Beam tower with no Lance and no Splash behaves exactly as today (no ring, no pierce, the line ends at the target).
