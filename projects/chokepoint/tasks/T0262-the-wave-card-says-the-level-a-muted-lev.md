---
id: T0262
title: "The wave card says the level: a muted \\\"level N · w/10\\\" line"
size: S
priority: 2
status: design
depends_on: [T0260]
attempts: 0
created: 2026-10-30T05:49:22Z
epic: E3
---

## Goal
The run's shape is readable at a glance: the wave card (top right) says which level the run is in and where the wave sits in it — E3's one HUD line.

## Details
- The wave card gains one small muted line under the wave number, the "held · N" chip's style (T0218): "level N · w/10", N the run's level and w the wave the card shows inside its level (wave 13 reads "level 2 · 3/10"; during the build phase the line refers to the wave about to start, like the number above it).
- The line shows from wave 1 ("level 1 · 1/10") until the run ends; while the card reads "Ready" (before wave 1) it is hidden. It is display-only: no input, no sound, nothing else on the card or the screen moves, and the "held · N" chip stays where it is.
- Nothing shown twice: no other element shows the level or the wave's place in it (the next-wave button shows the wave's enemies left, the stats card the lives and gold, the pause line the run so far).
- The card fits with the line and the chip at once, at 412x915 and 1280x720 (the longest line is "level 3 · 10/10").
- The file is the wave card's own file (src/ui/hud/WaveCard.ts if that is where it lives — the one that draws the top-right wave number and T0218's "held · N" chip); the closest example is T0218's held line in the same card.

## Acceptance criteria
- [ ] From wave 1 on, the wave card shows the muted "level 1 · 1/10" line under the number; it advances with the wave and reads "level 2 · 1/10" at wave 11.
- [ ] The line is hidden while the card reads "Ready", and it shows in both the build phase (referring to the next wave) and the wave phase.
- [ ] With the "held · N" chip showing, the line and the chip both fit the card at 412x915 and 1280x720.
- [ ] No other HUD element, scene or the pause screen changes.
