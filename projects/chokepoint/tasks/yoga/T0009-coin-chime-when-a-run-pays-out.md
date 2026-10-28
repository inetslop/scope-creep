---
id: T0009
title: Coin chime when a run pays out
assignee: yoga
size: S
priority: 3
status: design
depends_on: [T0001]
attempts: 0
created: 2026-10-28T01:07:07Z
epic: E1
---

## Goal
Earning coins is heard, not just read: the game-over "+N coins" line gets a short chime and a small pop.

## Details
- When the game-over card's "+N coins" line appears and N > 0: play a two-note chime — sine wave, E5 then G5, 80ms each, at the same soft volume as the other Sfx blips (closest example: the existing hit blip in audio/Sfx — add one new chime method next to it).
- The line pops in: scale from 1.15x down to 1.0x over 150ms, like the existing gold pop.
- When N = 0: no sound, no pop — the line appears plainly.

## Acceptance criteria
- [ ] A run that earns coins plays the chime exactly once, when the game-over card appears.
- [ ] A run that earns 0 coins plays no chime and the line has no pop.
- [ ] The pop lasts ~150ms and does not shift the other card lines.
- [ ] The chime volume matches the other UI sounds (no louder than the hit blip).
