---
id: T0138
title: "The slow shows on the enemy: a chip over the slowed"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-29T11:23:58Z
epic: E4
---

## Goal
A slowed enemy wears a small chip, so the player sees Frost is working on it — instead of a slowed enemy looking like one of the naturally slow types (Block, Hauler, Mute).

## Details
- While an enemy is slowed (its slow is active — the Frost tower's aura, or a hit from any tower with Frost added), one small 16x9 rounded chip in Frost's ice (the mark tick's chip look, T0099) rides just above the token, and clears the instant the slow ends.
- If the same enemy is slowed while another chip already rides above it (the Mark's pink tick, T0099, or the burn's chip, T0113), the chips sit side by side above the token without overlap.
- Display only: the slow's strength, its duration, and the enemy's movement are unchanged; no new sound, key, button, or pause-screen line.
- A new enemy hook file on the markTick pattern (T0099), so it builds beside the shared augment queue; the hook reads the enemy's existing slow state, so it adds no new field.

## Acceptance criteria
- [ ] While a Frost tower's aura slows an enemy, a small ice chip rides above that enemy's token; the chip clears the instant the slow ends.
- [ ] A hit from a tower with Frost added that slows an enemy shows the same chip.
- [ ] A slowed-and-marked enemy shows the ice chip and the Mark's pink tick side by side, without overlap.
- [ ] The slow's strength, duration and the enemy's speed are byte-identical to before; no new sound, key, button, or pause-screen line.
