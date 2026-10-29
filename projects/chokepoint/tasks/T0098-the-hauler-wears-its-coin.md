---
id: T0098
title: The Hauler wears its coin
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-29T02:55:25Z
---

## Goal
A first-time player sees the Hauler pays a small fortune before the first kill: the Hauler's token wears the game's coin.

## Details
- On the Hauler's token (T0057 — the big red hexagon at 1.3× Block's size) draw one small flat gold coin on the token's face: the HUD's own coin shape (the stats card's "+N coins" icon, T0013), scaled to about a third of the token's width, flat on the face (no side face, no shadow of its own, no pop), in the coin's own yellow.
- The coin is part of the Hauler's draw: it appears at spawn, sits under the hit flash and the death burst, and moves with the token. It is decoration on the token — not a new entity, effect or HUD element.
- The Hauler's numbers are untouched: hp, speed, size, 10 gold on a kill, 1 life plus 5 gold on a leak (the red "−5" pop), and its wave schedule (waves 9, 13, 17, …). No other enemy changes.
- No input, no sound, no rule change.
- Closest example: the Hauler's own token draw (T0057) for where it goes; the stats card's coin icon (T0013) for the shape. Each enemy now draws from its own content file — the coin lands in the Hauler's, the way the Mute's jam lives in its own files (T0074's pattern).

## Acceptance criteria
- [ ] Every Hauler on the board shows exactly one small flat yellow coin, centred on its hexagon's face, from spawn to death.
- [ ] The coin is the HUD's coin shape at about a third of the token's width, flat (no shadow, no bounce); every other enemy renders byte-identically.
- [ ] The Hauler's kill gold, leak cost and wave schedule are unchanged; desktop 1280x720 and mobile 412x915 smoke pass.
