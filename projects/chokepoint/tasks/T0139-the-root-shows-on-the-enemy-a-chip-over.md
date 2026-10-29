---
id: T0139
title: "The root shows on the enemy: a chip over the rooted"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-29T11:23:58Z
epic: E4
---

## Goal
A rooted (fully stopped) enemy wears a small chip, so the player sees the Anchor is holding it — and can tell a rooted enemy from a Dasher that has simply paused.

## Details
- While an enemy is rooted (fully stopped by an Anchor — the Anchor tower's pulse, or a hit from any tower with Anchor added), one small 16x9 rounded chip in Anchor's pink (the mark tick's chip look, T0099) rides just above the token, and clears the instant the root wears off.
- If the same enemy is rooted while another chip already rides above it (the Mark's pink tick, T0099, or the slow's chip, T0138), the chips sit side by side above the token without overlap.
- Display only: the root's duration, the enemy's stop, and the post-root root-resistance (the 2 s shrug, core/root.ts) are unchanged; no new sound, key, button, or pause-screen line.
- A new enemy hook file on the markTick pattern (T0099), so it builds beside the shared augment queue; the hook reads the enemy's existing root state, so it adds no new field.

## Acceptance criteria
- [ ] While an Anchor tower's pulse roots an enemy, a small pink chip rides above that enemy's token; the chip clears the instant the root wears off.
- [ ] A hit from a tower with Anchor added that roots an enemy shows the same chip.
- [ ] A rooted-and-marked enemy shows both chips (the Anchor's and the Mark's) side by side, without overlap.
- [ ] The root's duration, the enemy's stop, and the post-root resistance are byte-identical to before; no new sound, key, button, or pause-screen line.
