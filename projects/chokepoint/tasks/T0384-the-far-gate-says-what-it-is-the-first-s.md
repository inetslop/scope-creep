---
id: T0384
title: "The far gate says what it is: the first send's one-time chip"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-01T22:18:47Z
epic: E14
---

## Goal
A player who gets a board with the far gate learns what it is where it is: the run's first far-gate send wears a one-time chip at the gate, so a second entrance is never mistaken for decoration or an exit.

## Details
- **When:** the moment the far gate's send ring (T0360) fires for the first time in the run — the run's first wave that sends walkers through it (the ring's own rule: non-boss waves only).
- **What:** one small chip in the game's own chip look (the first-leak chip's look: muted ink on a small white rounded chip) that pops just above the far gate, reading "walkers come in here too", and fades after ~1.5 s (the first-leak chip's own timing). The ring still blooms at the gate as today; the chip rides above it and never covers the gate or the ring.
- **Once per run:** the run remembers the moment it has shown; a later wave never shows it again, and a run resumed after the moment does not replay it (a resume before the moment still shows it when it comes). A board without the far gate never shows it.
- **Nothing else:** no sound, no button, no new line on any card, no permanent mark on the board; the wave preview keeps showing what the wave sends (not where it comes from) and the pause's boards reference is unchanged.

## Acceptance criteria
- [ ] On a board with the far gate, the first time the send ring fires, a small white chip pops just above the gate reading "walkers come in here too" and fades after ~1.5 s; the ring itself is unchanged.
- [ ] The chip shows exactly once per run: no later wave shows it, and a run resumed after the moment does not replay it (a resume before the moment still shows it when it comes).
- [ ] On a board without the far gate the chip never shows; on a boss wave it never shows (the ring's own rule).
- [ ] No new sound, button, card line or permanent board mark; the wave preview card and the boards reference are byte-identical.
